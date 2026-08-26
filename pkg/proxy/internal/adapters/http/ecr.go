package httphandlers

import (
	"fmt"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ecr"
	ecrtypes "github.com/aws/aws-sdk-go-v2/service/ecr/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerECRRoutes(r chi.Router) {
	r.Route("/ecr", func(r chi.Router) {
		// Repositories
		r.Get("/repositories", h.ecrDescribeRepositories)
		r.Post("/repositories", h.ecrCreateRepository)
		r.Get("/repositories/{repositoryName:*}", h.ecrDescribeRepository)
		r.Delete("/repositories/{repositoryName:*}", h.ecrDeleteRepository)

		// Authorization
		r.Get("/authorization-token", h.ecrGetAuthorizationToken)

		// Images (specific routes must be registered before the generic one)
		r.Get("/images/details/{repositoryName:*}", h.ecrDescribeImages)
		r.Post("/images/batch-get/{repositoryName:*}", h.ecrBatchGetImage)
		r.Post("/images/batch-delete/{repositoryName:*}", h.ecrBatchDeleteImage)
		r.Get("/images/{repositoryName:*}", h.ecrListImages)

		// Tags
		r.Get("/tags/{repositoryName:*}", h.ecrListTagsForResource)
		r.Put("/tags/{repositoryName:*}", h.ecrUpdateTags)
	})
}

// ecrRepositoryARN builds the full ARN for a repository. ECR tag operations
// require a ResourceArn. The emulator uses the well-known account ID
// 000000000000 (see floci ECR docs).
func (h *ProxyHandler) ecrRepositoryARN(repositoryName string) string {
	return fmt.Sprintf("arn:aws:ecr:%s:000000000000:repository/%s", h.Svc.Region(), repositoryName)
}

// ---------------------------------------------------------------------------
// Repositories
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecrDescribeRepositories(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		RepositoryNames []string `json:"RepositoryNames"`
		NextToken       string   `json:"NextToken"`
		MaxResults      int32    `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ecr.DescribeRepositoriesInput{}
	if len(body.RepositoryNames) > 0 {
		input.RepositoryNames = body.RepositoryNames
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	result, err := h.Svc.ECR().DescribeRepositories(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe repositories", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrCreateRepository(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ecr.CreateRepositoryInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.ECR().CreateRepository(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create repository", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrDescribeRepository(w http.ResponseWriter, r *http.Request) {
	input := &ecr.DescribeRepositoriesInput{
		RepositoryNames: []string{urlParam(r, "repositoryName")},
	}
	result, err := h.Svc.ECR().DescribeRepositories(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe repository", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrDeleteRepository(w http.ResponseWriter, r *http.Request) {
	input := &ecr.DeleteRepositoryInput{
		RepositoryName: aws.String(urlParam(r, "repositoryName")),
	}
	if force := r.URL.Query().Get("force"); force == "true" {
		input.Force = true
	}
	result, err := h.Svc.ECR().DeleteRepository(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete repository", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecrGetAuthorizationToken(w http.ResponseWriter, r *http.Request) {
	result, err := h.Svc.ECR().GetAuthorizationToken(h.ctx, &ecr.GetAuthorizationTokenInput{})
	if err != nil {
		sendErrorWithStatus(w, "Failed to get authorization token", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecrListImages(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		NextToken  string `json:"NextToken"`
		MaxResults int32  `json:"MaxResults"`
		TagStatus  string `json:"TagStatus"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ecr.ListImagesInput{
		RepositoryName: aws.String(urlParam(r, "repositoryName")),
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	if body.TagStatus != "" {
		input.Filter = &ecrtypes.ListImagesFilter{
			TagStatus: ecrtypes.TagStatus(body.TagStatus),
		}
	}
	result, err := h.Svc.ECR().ListImages(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list images", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrDescribeImages(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ImageIds   []ecrtypes.ImageIdentifier `json:"ImageIds"`
		NextToken  string                     `json:"NextToken"`
		MaxResults int32                      `json:"MaxResults"`
		TagStatus  string                     `json:"TagStatus"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ecr.DescribeImagesInput{
		RepositoryName: aws.String(urlParam(r, "repositoryName")),
	}
	if len(body.ImageIds) > 0 {
		input.ImageIds = body.ImageIds
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	if body.TagStatus != "" {
		input.Filter = &ecrtypes.DescribeImagesFilter{
			TagStatus: ecrtypes.TagStatus(body.TagStatus),
		}
	}
	result, err := h.Svc.ECR().DescribeImages(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe images", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrBatchGetImage(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ImageIds           []ecrtypes.ImageIdentifier `json:"ImageIds"`
		AcceptedMediaTypes []string                   `json:"AcceptedMediaTypes"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ecr.BatchGetImageInput{
		RepositoryName: aws.String(urlParam(r, "repositoryName")),
	}
	if len(body.ImageIds) > 0 {
		input.ImageIds = body.ImageIds
	}
	if len(body.AcceptedMediaTypes) > 0 {
		input.AcceptedMediaTypes = body.AcceptedMediaTypes
	}
	result, err := h.Svc.ECR().BatchGetImage(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to batch get images", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrBatchDeleteImage(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		ImageIds []ecrtypes.ImageIdentifier `json:"ImageIds"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ecr.BatchDeleteImageInput{
		RepositoryName: aws.String(urlParam(r, "repositoryName")),
	}
	if len(body.ImageIds) > 0 {
		input.ImageIds = body.ImageIds
	}
	result, err := h.Svc.ECR().BatchDeleteImage(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to batch delete images", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecrListTagsForResource(w http.ResponseWriter, r *http.Request) {
	input := &ecr.ListTagsForResourceInput{
		ResourceArn: aws.String(h.ecrRepositoryARN(urlParam(r, "repositoryName"))),
	}
	result, err := h.Svc.ECR().ListTagsForResource(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list tags", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecrUpdateTags(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Tags        map[string]string `json:"Tags"`
		RemovedKeys []string          `json:"RemovedKeys"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	resourceArn := h.ecrRepositoryARN(urlParam(r, "repositoryName"))
	for key, value := range body.Tags {
		_, err := h.Svc.ECR().TagResource(h.ctx, &ecr.TagResourceInput{
			ResourceArn: aws.String(resourceArn),
			Tags:        []ecrtypes.Tag{{Key: aws.String(key), Value: aws.String(value)}},
		})
		if err != nil {
			sendErrorWithStatus(w, "Failed to update tags", err)
			return
		}
	}
	for _, key := range body.RemovedKeys {
		_, err := h.Svc.ECR().UntagResource(h.ctx, &ecr.UntagResourceInput{
			ResourceArn: aws.String(resourceArn),
			TagKeys:     []string{key},
		})
		if err != nil {
			sendErrorWithStatus(w, "Failed to update tags", err)
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Tags updated successfully"})
}