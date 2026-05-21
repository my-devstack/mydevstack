package httphandlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
)

func (h *ProxyHandler) handleS3(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")

	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListBuckets"):
		h.listBuckets(ctx, w, r)
	case strings.Contains(xAmzTarget, "ListObjectsV2"):
		h.listObjectsV2(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PresignGetObject"):
		h.presignGetObject(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PresignPutObject"):
		h.presignPutObject(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetObject"):
		h.getObject(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutObject"):
		h.putObject(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteObject"):
		h.deleteObject(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteBucket"):
		h.deleteBucket(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "HeadBucket"):
		h.headBucket(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "HeadObject"):
		h.headObject(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateBucket"):
		h.createBucket(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetBucketVersioning"):
		h.getBucketVersioning(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetBucketEncryption"):
		h.getBucketEncryption(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetBucketTagging"):
		h.getBucketTagging(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutBucketPolicy"):
		h.putBucketPolicy(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutBucketVersioning"):
		h.putBucketVersioning(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutBucketEncryption"):
		h.putBucketEncryption(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutBucketTagging"):
		h.putBucketTagging(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutPublicAccessBlock"):
		h.putPublicAccessBlock(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetPublicAccessBlock"):
		h.getPublicAccessBlock(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutBucketNotificationConfiguration"):
		h.putBucketNotificationConfiguration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetBucketNotificationConfiguration"):
		h.getBucketNotificationConfiguration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetBucketPolicy"):
		h.getBucketPolicy(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown S3 action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listBuckets(ctx context.Context, w http.ResponseWriter, r *http.Request) {
	result, err := h.Svc.S3().ListBuckets(ctx)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list buckets", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listObjectsV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.ListObjectsV2Input{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().ListObjectsV2(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list objects", err)
		return
	}

	type objInfo struct {
		Key          string
		LastModified string
		ETag         string
		Size         int64
		StorageClass string
	}

	type listObjectsV2Output struct {
		IsTruncated           bool
		NextContinuationToken *string
		Contents              []objInfo
		CommonPrefixes        []struct{ Prefix string }
	}

	output := listObjectsV2Output{
		IsTruncated:           result.IsTruncated != nil && *result.IsTruncated,
		NextContinuationToken: result.NextContinuationToken,
	}

	for _, obj := range result.Contents {
		output.Contents = append(output.Contents, objInfo{
			Key:          *obj.Key,
			LastModified: obj.LastModified.UTC().Format("2006-01-02T15:04:05Z"),
			ETag:         *obj.ETag,
			Size:         *obj.Size,
			StorageClass: string(obj.StorageClass),
		})
	}

	for _, p := range result.CommonPrefixes {
		output.CommonPrefixes = append(output.CommonPrefixes, struct{ Prefix string }{Prefix: *p.Prefix})
	}

	writeJSON(w, http.StatusOK, output)
}

func (h *ProxyHandler) getObject(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetObjectInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetObject(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get object", err)
		return
	}

	data, err := io.ReadAll(result.Body)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to read object body", err)
		return
	}
	if closeErr := result.Body.Close(); closeErr != nil {
		log.Printf("Failed to close response body: %v", closeErr)
	}

	contentType := "application/octet-stream"
	if result.ContentType != nil {
		contentType = *result.ContentType
	}
	writeData(w, http.StatusOK, contentType, data)
}

type PutObjectInputJSON struct {
	Bucket      *string `json:"Bucket"`
	Key         *string `json:"Key"`
	Body        any     `json:"Body"`
	ContentType *string `json:"ContentType"`
}

func (h *ProxyHandler) putObject(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	var inputJSON PutObjectInputJSON
	if err := json.Unmarshal(bodyBytes, &inputJSON); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &s3.PutObjectInput{
		Bucket:      inputJSON.Bucket,
		Key:         inputJSON.Key,
		ContentType: inputJSON.ContentType,
	}

	if inputJSON.Body != nil {
		switch v := inputJSON.Body.(type) {
		case string:
			input.Body = strings.NewReader(v)
		case []interface{}:
			data := make([]byte, len(v))
			for i, b := range v {
				f, ok := b.(float64)
				if !ok {
					sendError(w, http.StatusBadRequest, "Invalid body format", nil)
					return
				}
				data[i] = byte(int(f))
			}
			input.Body = bytes.NewReader(data)
		}
	}

	result, err := h.Svc.S3().PutObject(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put object", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteObject(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.DeleteObjectInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().DeleteObject(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete object", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteBucket(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.DeleteBucketInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().DeleteBucket(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete bucket", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) headBucket(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.HeadBucketInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	_, err := h.Svc.S3().HeadBucket(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to head bucket", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "OK"})
}

func (h *ProxyHandler) headObject(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.HeadObjectInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().HeadObject(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to head object", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createBucket(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.CreateBucketInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().CreateBucket(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create bucket", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketVersioning(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetBucketVersioningInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetBucketVersioning(ctx, input)
	if err != nil {
		// Return empty versioning status instead of error (bucket may not have versioning)
		writeJSON(w, http.StatusOK, map[string]interface{}{"Status": ""})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketEncryption(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetBucketEncryptionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetBucketEncryption(ctx, input)
	if err != nil {
		// Return empty encryption config instead of error (bucket may not have encryption)
		writeJSON(w, http.StatusOK, &s3.GetBucketEncryptionOutput{
			ServerSideEncryptionConfiguration: nil,
		})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketTagging(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetBucketTaggingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetBucketTagging(ctx, input)
	if err != nil {
		// Return empty tags instead of error (bucket may not have tags)
		writeJSON(w, http.StatusOK, &s3.GetBucketTaggingOutput{
			TagSet: nil,
		})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

type PresignInput struct {
	Bucket  *string `json:"Bucket"`
	Key     *string `json:"Key"`
	Expires *int64  `json:"Expires"`
}

func (h *ProxyHandler) presignGetObject(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &PresignInput{}
	if err := json.Unmarshal(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.Bucket == nil || input.Key == nil {
		sendError(w, http.StatusBadRequest, "Bucket and Key are required", nil)
		return
	}
	expires := time.Duration(3600) * time.Second
	if input.Expires != nil && *input.Expires > 0 {
		expires = time.Duration(*input.Expires) * time.Second
	}
	url, err := h.Svc.S3().PresignGetObject(ctx, *input.Bucket, *input.Key, expires)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate presigned URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"url": url})
}

func (h *ProxyHandler) presignPutObject(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &PresignInput{}
	if err := json.Unmarshal(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.Bucket == nil || input.Key == nil {
		sendError(w, http.StatusBadRequest, "Bucket and Key are required", nil)
		return
	}
	expires := time.Duration(3600) * time.Second
	if input.Expires != nil && *input.Expires > 0 {
		expires = time.Duration(*input.Expires) * time.Second
	}
	url, err := h.Svc.S3().PresignPutObject(ctx, *input.Bucket, *input.Key, expires)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate presigned URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"url": url})
}

func (h *ProxyHandler) putBucketPolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.PutBucketPolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().PutBucketPolicy(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketVersioning(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.PutBucketVersioningInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().PutBucketVersioning(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket versioning", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketEncryption(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.PutBucketEncryptionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().PutBucketEncryption(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket encryption", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketTagging(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.PutBucketTaggingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().PutBucketTagging(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket tagging", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putPublicAccessBlock(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.PutPublicAccessBlockInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().PutPublicAccessBlock(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put public access block", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getPublicAccessBlock(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetPublicAccessBlockInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetPublicAccessBlock(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get public access block", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketNotificationConfiguration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.PutBucketNotificationConfigurationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().PutBucketNotificationConfiguration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket notification configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketNotificationConfiguration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetBucketNotificationConfigurationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetBucketNotificationConfiguration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get bucket notification configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketPolicy(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &s3.GetBucketPolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().GetBucketPolicy(ctx, input)
	if err != nil {
		// Return empty if no policy exists
		writeJSON(w, http.StatusOK, &s3.GetBucketPolicyOutput{})
		return
	}
	writeJSON(w, http.StatusOK, result)
}
