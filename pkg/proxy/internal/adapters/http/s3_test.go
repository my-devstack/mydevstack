package httphandlers

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/s3/types"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// S3 — listBuckets
// ---------------------------------------------------------------------------

func TestS3_ListBuckets(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().ListBuckets(mock.Anything).Return(&s3.ListBucketsOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().ListBuckets(mock.Anything).Return(nil, errors.New("s3 error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — listObjectsV2
// ---------------------------------------------------------------------------

func TestS3_ListObjectsV2(t *testing.T) {
	t.Parallel()

	t.Run("success with contents and common prefixes", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		owner := &types.Owner{DisplayName: strPtr("owner"), ID: strPtr("id123")}
		now := time.Now()
		mp.EXPECT().ListObjectsV2(mock.Anything, mock.Anything).Return(&s3.ListObjectsV2Output{
			IsTruncated: boolPtr(true),
			NextContinuationToken: strPtr("nextToken"),
			Contents: []types.Object{
				{Key: strPtr("file1.txt"), LastModified: &now, ETag: strPtr(`"abc123"`), Size: int64Ptr(1024), StorageClass: types.ObjectStorageClassStandard, Owner: owner},
			},
			CommonPrefixes: []types.CommonPrefix{{Prefix: strPtr("subdir/")}},
		}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/my-bucket/objects", []byte(`{"Bucket":"my-bucket"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, true, resp["IsTruncated"])
		assert.Equal(t, "nextToken", resp["NextContinuationToken"])
		// Verify Contents transformation
		contents, ok := resp["Contents"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, contents, 1)
		item := contents[0].(map[string]interface{})
		assert.Equal(t, "file1.txt", item["Key"])
		assert.EqualValues(t, 1024, item["Size"])
		assert.Equal(t, "STANDARD", item["StorageClass"])
		// Verify CommonPrefixes
		prefixes, ok := resp["CommonPrefixes"].([]interface{})
		assert.True(t, ok)
		assert.Len(t, prefixes, 1)
		prefixItem := prefixes[0].(map[string]interface{})
		assert.Equal(t, "subdir/", prefixItem["Prefix"])
	})

	t.Run("empty", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().ListObjectsV2(mock.Anything, mock.Anything).Return(&s3.ListObjectsV2Output{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/my-bucket/objects", []byte(`{"Bucket":"my-bucket"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, false, resp["IsTruncated"])
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().ListObjectsV2(mock.Anything, mock.Anything).Return(nil, errors.New("list error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/my-bucket/objects", []byte(`{"Bucket":"my-bucket"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/my-bucket/objects", []byte(`{invalid json`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — presignGetObject
// ---------------------------------------------------------------------------

func TestS3_PresignGetObject(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PresignGetObject(mock.Anything, "my-bucket", "my-key", 3600*time.Second).
			Return("https://presigned.url", nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-get", []byte(`{"Bucket":"my-bucket","Key":"my-key"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "https://presigned.url", resp["url"])
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PresignGetObject(mock.Anything, "my-bucket", "my-key", 3600*time.Second).
			Return("", errors.New("presign error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-get", []byte(`{"Bucket":"my-bucket","Key":"my-key"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom Expires", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PresignGetObject(mock.Anything, "my-bucket", "my-key", 100*time.Second).
			Return("https://presigned.url", nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-get", []byte(`{"Bucket":"my-bucket","Key":"my-key","Expires":100}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-get", []byte(`{bad json`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — presignPutObject
// ---------------------------------------------------------------------------

func TestS3_PresignPutObject(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PresignPutObject(mock.Anything, "my-bucket", "my-key", 3600*time.Second).
			Return("https://presigned.url", nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-put", []byte(`{"Bucket":"my-bucket","Key":"my-key"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "https://presigned.url", resp["url"])
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PresignPutObject(mock.Anything, "my-bucket", "my-key", 3600*time.Second).
			Return("", errors.New("presign error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-put", []byte(`{"Bucket":"my-bucket","Key":"my-key"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom Expires", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PresignPutObject(mock.Anything, "my-bucket", "my-key", 200*time.Second).
			Return("https://presigned.url", nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-put", []byte(`{"Bucket":"my-bucket","Key":"my-key","Expires":200}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/my-bucket/presign-put", []byte(`{bad json`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — getObject
// ---------------------------------------------------------------------------

func TestS3_GetObject(t *testing.T) {
	t.Parallel()

	t.Run("success with body reading and ContentType", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		contentType := "text/plain"
		mp.EXPECT().GetObject(mock.Anything, mock.Anything).Return(&s3.GetObjectOutput{
			Body:        io.NopCloser(strings.NewReader("data")),
			ContentType: &contentType,
		}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusOK, w.Code)
		assert.Equal(t, "text/plain", w.Header().Get("Content-Type"))
		assert.Equal(t, "data", w.Body.String())
	})

	t.Run("body read error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		// Return a body that fails on read
		mp.EXPECT().GetObject(mock.Anything, mock.Anything).Return(&s3.GetObjectOutput{
			Body: io.NopCloser(&errReader{errors.New("read error")}),
		}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetObject(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// errReader implements io.Reader which always returns an error.
type errReader struct{ err error }

func (r *errReader) Read([]byte) (int, error) { return 0, r.err }

// ---------------------------------------------------------------------------
// S3 — putObject
// ---------------------------------------------------------------------------

func TestS3_PutObject(t *testing.T) {
	t.Parallel()

	t.Run("success with body as string", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutObject(mock.Anything, mock.Anything).Return(&s3.PutObjectOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/b/objects",
			[]byte(`{"Bucket":"b","Key":"k","Body":"hello world","ContentType":"text/plain"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("success with body as []byte array", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutObject(mock.Anything, mock.Anything).Return(&s3.PutObjectOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/b/objects",
			[]byte(`{"Bucket":"b","Key":"k","Body":[72,101,108,108,111]}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutObject(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/b/objects",
			[]byte(`{"Bucket":"b","Key":"k","Body":"data"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("invalid body format", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/b/objects",
			[]byte(`{"Bucket":"b","Key":"k","Body":[72,"not-a-byte",108]}`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	t.Run("invalid JSON", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets/b/objects", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — deleteObject
// ---------------------------------------------------------------------------

func TestS3_DeleteObject(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().DeleteObject(mock.Anything, mock.Anything).Return(&s3.DeleteObjectOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "DELETE", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().DeleteObject(mock.Anything, mock.Anything).Return(nil, errors.New("delete error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "DELETE", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — deleteBucket
// ---------------------------------------------------------------------------

func TestS3_DeleteBucket(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().DeleteBucket(mock.Anything, mock.Anything).Return(&s3.DeleteBucketOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "DELETE", "/s3/buckets/b", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().DeleteBucket(mock.Anything, mock.Anything).Return(nil, errors.New("delete error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "DELETE", "/s3/buckets/b", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — headBucket
// ---------------------------------------------------------------------------

func TestS3_HeadBucket(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().HeadBucket(mock.Anything, mock.Anything).Return(&s3.HeadBucketOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "HEAD", "/s3/buckets/b", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "OK", resp["status"])
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().HeadBucket(mock.Anything, mock.Anything).Return(nil, errors.New("head error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "HEAD", "/s3/buckets/b", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — headObject
// ---------------------------------------------------------------------------

func TestS3_HeadObject(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().HeadObject(mock.Anything, mock.Anything).Return(&s3.HeadObjectOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "HEAD", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().HeadObject(mock.Anything, mock.Anything).Return(nil, errors.New("head error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "HEAD", "/s3/buckets/b/objects/k", []byte(`{"Bucket":"b","Key":"k"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — createBucket
// ---------------------------------------------------------------------------

func TestS3_CreateBucket(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().CreateBucket(mock.Anything, mock.Anything).Return(&s3.CreateBucketOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets", []byte(`{"Bucket":"new-bucket"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().CreateBucket(mock.Anything, mock.Anything).Return(nil, errors.New("create error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets", []byte(`{"Bucket":"new-bucket"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/s3/buckets", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — getBucketVersioning
// ---------------------------------------------------------------------------

func TestS3_GetBucketVersioning(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketVersioning(mock.Anything, mock.Anything).Return(
			&s3.GetBucketVersioningOutput{Status: types.BucketVersioningStatusEnabled}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/versioning", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "Enabled", resp["Status"])
	})

	t.Run("error returns empty status", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketVersioning(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/versioning", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "", resp["Status"])
	})
}

// ---------------------------------------------------------------------------
// S3 — getBucketEncryption
// ---------------------------------------------------------------------------

func TestS3_GetBucketEncryption(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketEncryption(mock.Anything, mock.Anything).Return(
			&s3.GetBucketEncryptionOutput{
				ServerSideEncryptionConfiguration: &types.ServerSideEncryptionConfiguration{
					Rules: []types.ServerSideEncryptionRule{
						{ApplyServerSideEncryptionByDefault: &types.ServerSideEncryptionByDefault{SSEAlgorithm: types.ServerSideEncryptionAes256}},
					},
				},
			}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/encryption", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error returns empty config", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketEncryption(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/encryption", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Nil(t, resp["ServerSideEncryptionConfiguration"])
	})
}

// ---------------------------------------------------------------------------
// S3 — getBucketTagging
// ---------------------------------------------------------------------------

func TestS3_GetBucketTagging(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketTagging(mock.Anything, mock.Anything).Return(
			&s3.GetBucketTaggingOutput{TagSet: []types.Tag{{Key: strPtr("k1"), Value: strPtr("v1")}}}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/tagging", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.NotNil(t, resp["TagSet"])
	})

	t.Run("error returns empty tags", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketTagging(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/tagging", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Nil(t, resp["TagSet"])
	})
}

// ---------------------------------------------------------------------------
// S3 — putBucketPolicy
// ---------------------------------------------------------------------------

func TestS3_PutBucketPolicy(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketPolicy(mock.Anything, mock.Anything).Return(&s3.PutBucketPolicyOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/policy", []byte(`{"Bucket":"b","Policy":"{}"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketPolicy(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/policy", []byte(`{"Bucket":"b","Policy":"{}"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/policy", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — putBucketVersioning
// ---------------------------------------------------------------------------

func TestS3_PutBucketVersioning(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketVersioning(mock.Anything, mock.Anything).Return(&s3.PutBucketVersioningOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/versioning", []byte(`{"Bucket":"b","VersioningConfiguration":{"Status":"Enabled"}}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketVersioning(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/versioning", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/versioning", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — putBucketEncryption
// ---------------------------------------------------------------------------

func TestS3_PutBucketEncryption(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketEncryption(mock.Anything, mock.Anything).Return(&s3.PutBucketEncryptionOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/encryption", []byte(`{"Bucket":"b","ServerSideEncryptionConfiguration":{"Rules":[]}}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketEncryption(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/encryption", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/encryption", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — putBucketTagging
// ---------------------------------------------------------------------------

func TestS3_PutBucketTagging(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketTagging(mock.Anything, mock.Anything).Return(&s3.PutBucketTaggingOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/tagging", []byte(`{"Bucket":"b","Tagging":{"TagSet":[]}}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketTagging(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/tagging", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/tagging", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — putPublicAccessBlock
// ---------------------------------------------------------------------------

func TestS3_PutPublicAccessBlock(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutPublicAccessBlock(mock.Anything, mock.Anything).Return(&s3.PutPublicAccessBlockOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/public-access-block", []byte(`{"Bucket":"b","PublicAccessBlockConfiguration":{}}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutPublicAccessBlock(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/public-access-block", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/public-access-block", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — getPublicAccessBlock
// ---------------------------------------------------------------------------

func TestS3_GetPublicAccessBlock(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetPublicAccessBlock(mock.Anything, mock.Anything).Return(&s3.GetPublicAccessBlockOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/public-access-block", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetPublicAccessBlock(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/public-access-block", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — putBucketNotificationConfiguration
// ---------------------------------------------------------------------------

func TestS3_PutBucketNotificationConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketNotificationConfiguration(mock.Anything, mock.Anything).Return(&s3.PutBucketNotificationConfigurationOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/notification", []byte(`{"Bucket":"b","NotificationConfiguration":{}}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketNotificationConfiguration(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/notification", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/notification", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — getBucketNotificationConfiguration
// ---------------------------------------------------------------------------

func TestS3_GetBucketNotificationConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketNotificationConfiguration(mock.Anything, mock.Anything).Return(&s3.GetBucketNotificationConfigurationOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/notification", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketNotificationConfiguration(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/notification", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — getBucketPolicy
// ---------------------------------------------------------------------------

func TestS3_GetBucketPolicy(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketPolicy(mock.Anything, mock.Anything).Return(
			&s3.GetBucketPolicyOutput{Policy: strPtr(`{"Version":"2012-10-17"}`)}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/policy", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.NotNil(t, resp["Policy"])
	})

	t.Run("error returns empty output", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketPolicy(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/policy", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — getBucketLifecycleConfiguration
// ---------------------------------------------------------------------------

func TestS3_GetBucketLifecycleConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketLifecycleConfiguration(mock.Anything, mock.Anything).Return(
			&s3.GetBucketLifecycleConfigurationOutput{
				Rules: []types.LifecycleRule{
					{ID: strPtr("rule1"), Status: types.ExpirationStatusEnabled},
				},
			}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/lifecycle", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.NotNil(t, resp["Rules"])
	})

	t.Run("error returns empty rules", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().GetBucketLifecycleConfiguration(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "GET", "/s3/buckets/b/lifecycle", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)

		var resp map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Nil(t, resp["Rules"])
	})
}

// ---------------------------------------------------------------------------
// S3 — putBucketLifecycleConfiguration
// ---------------------------------------------------------------------------

func TestS3_PutBucketLifecycleConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketLifecycleConfiguration(mock.Anything, mock.Anything).Return(&s3.PutBucketLifecycleConfigurationOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/lifecycle", []byte(`{"Bucket":"b","LifecycleConfiguration":{"Rules":[{"ID":"rule1","Status":"Enabled","Filter":{}}]}}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().PutBucketLifecycleConfiguration(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/lifecycle", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "PUT", "/s3/buckets/b/lifecycle", []byte(`{bad`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — deleteBucketLifecycleConfiguration
// ---------------------------------------------------------------------------

func TestS3_DeleteBucketLifecycleConfiguration(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().DeleteBucketLifecycle(mock.Anything, mock.Anything).Return(&s3.DeleteBucketLifecycleOutput{}, nil)
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "DELETE", "/s3/buckets/b/lifecycle", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewS3Port(t)
		mp.EXPECT().DeleteBucketLifecycle(mock.Anything, mock.Anything).Return(nil, errors.New("delete error"))
		svc.EXPECT().S3().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "DELETE", "/s3/buckets/b/lifecycle", []byte(`{"Bucket":"b"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// S3 — unknown action
// ---------------------------------------------------------------------------

func TestS3_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := NewProxyHandler(context.Background(), svc, versionSvc)
	r := setupTestRouter(handler)
	w := performRequest(r, "GET", "/s3/unknown", []byte("{}"))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func strPtr(s string) *string { return &s }

func boolPtr(b bool) *bool { return &b }

func int64Ptr(i int64) *int64 { return &i }
