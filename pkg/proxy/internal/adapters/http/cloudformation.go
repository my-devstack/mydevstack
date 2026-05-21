package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
)

func (h *ProxyHandler) handleCloudFormation(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")

	bodyBytes := readBody(r)
	ctx := r.Context()

	switch {
	case strings.HasSuffix(xAmzTarget, "ListStacks"):
		h.listStacks(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "CreateStack"):
		h.createStack(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DeleteStack"):
		h.deleteStack(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "DescribeStacks"):
		h.describeStacks(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "GetTemplate"):
		h.getTemplate(ctx, w, r, bodyBytes)
	case strings.HasSuffix(xAmzTarget, "ListStackResources"):
		h.listStackResources(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown CloudFormation action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listStacks(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudformation.ListStacksInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().ListStacks(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list stacks", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStack(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudformation.CreateStackInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().CreateStack(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stack", err)
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *ProxyHandler) deleteStack(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudformation.DeleteStackInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().DeleteStack(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stack", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStacks(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudformation.DescribeStacksInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().DescribeStacks(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stacks", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getTemplate(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudformation.GetTemplateInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().GetTemplate(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listStackResources(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &cloudformation.ListStackResourcesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().ListStackResources(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list stack resources", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
