package httphandlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	s3types "github.com/aws/aws-sdk-go-v2/service/s3/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerS3Routes(r chi.Router) {
	r.Route("/s3", func(r chi.Router) {
		r.Get("/buckets", h.listBuckets)
		r.Post("/buckets", h.createBucket)
		r.Delete("/buckets/{bucket}", h.deleteBucket)
		r.Head("/buckets/{bucket}", h.headBucket)

		r.Get("/buckets/{bucket}/objects", h.listObjectsV2)
		r.Get("/buckets/{bucket}/objects/{key}", h.getObject)
		r.Post("/buckets/{bucket}/objects", h.putObject)
		r.Delete("/buckets/{bucket}/objects/{key}", h.deleteObject)
		r.Head("/buckets/{bucket}/objects/{key}", h.headObject)

		r.Post("/buckets/{bucket}/presign-get", h.presignGetObject)
		r.Post("/buckets/{bucket}/presign-put", h.presignPutObject)

		r.Get("/buckets/{bucket}/versioning", h.getBucketVersioning)
		r.Put("/buckets/{bucket}/versioning", h.putBucketVersioning)
		r.Get("/buckets/{bucket}/encryption", h.getBucketEncryption)
		r.Put("/buckets/{bucket}/encryption", h.putBucketEncryption)
		r.Get("/buckets/{bucket}/tagging", h.getBucketTagging)
		r.Put("/buckets/{bucket}/tagging", h.putBucketTagging)
		r.Get("/buckets/{bucket}/policy", h.getBucketPolicy)
		r.Put("/buckets/{bucket}/policy", h.putBucketPolicy)
		r.Get("/buckets/{bucket}/public-access-block", h.getPublicAccessBlock)
		r.Put("/buckets/{bucket}/public-access-block", h.putPublicAccessBlock)
		r.Get("/buckets/{bucket}/notification", h.getBucketNotificationConfiguration)
		r.Put("/buckets/{bucket}/notification", h.putBucketNotificationConfiguration)
	})
}

func (h *ProxyHandler) listBuckets(w http.ResponseWriter, r *http.Request) {
	result, err := h.Svc.S3().ListBuckets(h.ctx)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list buckets", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listObjectsV2(w http.ResponseWriter, r *http.Request) {
	// Read params from body (POST) or query string (GET)
	prefix := r.URL.Query().Get("prefix")
	delimiter := r.URL.Query().Get("delimiter")
	maxKeysStr := r.URL.Query().Get("maxKeys")
	continuationToken := r.URL.Query().Get("continuationToken")
	startAfter := r.URL.Query().Get("startAfter")
	encodingType := r.URL.Query().Get("encodingType")

	// Also try parsing JSON body for backward compatibility (POST calls)
	if bodyBytes := readBody(r); len(bodyBytes) > 0 {
		var body struct {
			Prefix            string `json:"Prefix"`
			Delimiter         string `json:"Delimiter"`
			MaxKeys           int32  `json:"MaxKeys"`
			ContinuationToken string `json:"ContinuationToken"`
			StartAfter        string `json:"StartAfter"`
			FetchOwner        bool   `json:"FetchOwner"`
			EncodingType      string `json:"EncodingType"`
		}
		if err := json.Unmarshal(bodyBytes, &body); err != nil {
			sendError(w, http.StatusBadRequest, "Invalid request body", err)
			return
		}
		if body.Prefix != "" {
			prefix = body.Prefix
		}
		if body.Delimiter != "" {
			delimiter = body.Delimiter
		}
		if body.MaxKeys > 0 {
			maxKeysStr = fmt.Sprint(body.MaxKeys)
		}
		if body.ContinuationToken != "" {
			continuationToken = body.ContinuationToken
		}
		if body.StartAfter != "" {
			startAfter = body.StartAfter
		}
		if body.EncodingType != "" {
			encodingType = body.EncodingType
		}
	}

	input := &s3.ListObjectsV2Input{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	if prefix != "" {
		input.Prefix = aws.String(prefix)
	}
	if delimiter != "" {
		input.Delimiter = aws.String(delimiter)
	}
	if maxKeysStr != "" {
		var mk int
		if _, err := fmt.Sscanf(maxKeysStr, "%d", &mk); err == nil && mk > 0 {
			input.MaxKeys = aws.Int32(int32(mk))
		}
	}
	if continuationToken != "" {
		input.ContinuationToken = aws.String(continuationToken)
	}
	if startAfter != "" {
		input.StartAfter = aws.String(startAfter)
	}
	if encodingType != "" {
		input.EncodingType = s3types.EncodingType(encodingType)
	}

	result, err := h.Svc.S3().ListObjectsV2(h.ctx, input)
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

func (h *ProxyHandler) getObject(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetObjectInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
		Key:    aws.String(urlParam(r, "key")),
	}
	result, err := h.Svc.S3().GetObject(h.ctx, input)
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

func (h *ProxyHandler) putObject(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var inputJSON PutObjectInputJSON
	if err := json.Unmarshal(bodyBytes, &inputJSON); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &s3.PutObjectInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
		Key:    inputJSON.Key,
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

	result, err := h.Svc.S3().PutObject(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put object", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteObject(w http.ResponseWriter, r *http.Request) {
	input := &s3.DeleteObjectInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
		Key:    aws.String(urlParam(r, "key")),
	}
	result, err := h.Svc.S3().DeleteObject(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete object", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteBucket(w http.ResponseWriter, r *http.Request) {
	input := &s3.DeleteBucketInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().DeleteBucket(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete bucket", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) headBucket(w http.ResponseWriter, r *http.Request) {
	input := &s3.HeadBucketInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	_, err := h.Svc.S3().HeadBucket(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to head bucket", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"status": "OK"})
}

func (h *ProxyHandler) headObject(w http.ResponseWriter, r *http.Request) {
	input := &s3.HeadObjectInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
		Key:    aws.String(urlParam(r, "key")),
	}
	result, err := h.Svc.S3().HeadObject(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to head object", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createBucket(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.CreateBucketInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.S3().CreateBucket(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create bucket", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketVersioning(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetBucketVersioningInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().GetBucketVersioning(h.ctx, input)
	if err != nil {
		// Return empty versioning status instead of error (bucket may not have versioning)
		writeJSON(w, http.StatusOK, map[string]interface{}{"Status": ""})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketEncryption(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetBucketEncryptionInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().GetBucketEncryption(h.ctx, input)
	if err != nil {
		// Return empty encryption config instead of error (bucket may not have encryption)
		writeJSON(w, http.StatusOK, &s3.GetBucketEncryptionOutput{
			ServerSideEncryptionConfiguration: nil,
		})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketTagging(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetBucketTaggingInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().GetBucketTagging(h.ctx, input)
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

func (h *ProxyHandler) presignGetObject(w http.ResponseWriter, r *http.Request) {
	input := &PresignInput{}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))

	bodyBytes := readBody(r)
	if len(bodyBytes) > 0 {
		var body PresignInput
		if err := json.Unmarshal(bodyBytes, &body); err == nil {
			input.Key = body.Key
			input.Expires = body.Expires
		}
	}

	if input.Key == nil || *input.Key == "" {
		sendError(w, http.StatusBadRequest, "Key is required", nil)
		return
	}
	expires := time.Duration(3600) * time.Second
	if input.Expires != nil && *input.Expires > 0 {
		expires = time.Duration(*input.Expires) * time.Second
	}
	url, err := h.Svc.S3().PresignGetObject(h.ctx, *input.Bucket, *input.Key, expires)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate presigned URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"url": url})
}

func (h *ProxyHandler) presignPutObject(w http.ResponseWriter, r *http.Request) {
	input := &PresignInput{}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))

	bodyBytes := readBody(r)
	if len(bodyBytes) > 0 {
		var body PresignInput
		if err := json.Unmarshal(bodyBytes, &body); err == nil {
			input.Key = body.Key
			input.Expires = body.Expires
		}
	}

	if input.Key == nil || *input.Key == "" {
		sendError(w, http.StatusBadRequest, "Key is required", nil)
		return
	}
	expires := time.Duration(3600) * time.Second
	if input.Expires != nil && *input.Expires > 0 {
		expires = time.Duration(*input.Expires) * time.Second
	}
	url, err := h.Svc.S3().PresignPutObject(h.ctx, *input.Bucket, *input.Key, expires)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to generate presigned URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"url": url})
}

func (h *ProxyHandler) putBucketPolicy(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.PutBucketPolicyInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))
	result, err := h.Svc.S3().PutBucketPolicy(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket policy", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketVersioning(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.PutBucketVersioningInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))
	result, err := h.Svc.S3().PutBucketVersioning(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket versioning", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketEncryption(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.PutBucketEncryptionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))
	result, err := h.Svc.S3().PutBucketEncryption(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket encryption", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketTagging(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.PutBucketTaggingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))
	result, err := h.Svc.S3().PutBucketTagging(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket tagging", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putPublicAccessBlock(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.PutPublicAccessBlockInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))
	result, err := h.Svc.S3().PutPublicAccessBlock(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put public access block", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getPublicAccessBlock(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetPublicAccessBlockInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().GetPublicAccessBlock(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get public access block", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putBucketNotificationConfiguration(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &s3.PutBucketNotificationConfigurationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.Bucket = aws.String(chi.URLParam(r, "bucket"))
	result, err := h.Svc.S3().PutBucketNotificationConfiguration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put bucket notification configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketNotificationConfiguration(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetBucketNotificationConfigurationInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().GetBucketNotificationConfiguration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get bucket notification configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getBucketPolicy(w http.ResponseWriter, r *http.Request) {
	input := &s3.GetBucketPolicyInput{
		Bucket: aws.String(chi.URLParam(r, "bucket")),
	}
	result, err := h.Svc.S3().GetBucketPolicy(h.ctx, input)
	if err != nil {
		// Return empty if no policy exists
		writeJSON(w, http.StatusOK, &s3.GetBucketPolicyOutput{})
		return
	}
	writeJSON(w, http.StatusOK, result)
}
