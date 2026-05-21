package httphandlers

import (
	"context"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/ssm"
)

func (h *ProxyHandler) handleSSM(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "GetParameter"):
		h.getParameter(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetParameters"):
		h.getParameters(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetParametersByPath"):
		h.getParametersByPath(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutParameter"):
		h.putParameter(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteParameter"):
		h.deleteParameter(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeParameters"):
		h.describeParameters(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetParameterHistory"):
		h.getParameterHistory(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListTagsForResource"):
		h.listTagsForResource(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "AddTagsToResource"):
		h.addTagsToResource(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "RemoveTagsFromResource"):
		h.removeTagsFromResource(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown SSM action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) getParameter(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.GetParameterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().GetParameter(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get parameter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getParameters(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.GetParametersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().GetParameters(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get parameters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getParametersByPath(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.GetParametersByPathInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().GetParametersByPath(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get parameters by path", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putParameter(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.PutParameterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().PutParameter(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put parameter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteParameter(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.DeleteParameterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().DeleteParameter(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete parameter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeParameters(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.DescribeParametersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().DescribeParameters(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe parameters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getParameterHistory(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.GetParameterHistoryInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().GetParameterHistory(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get parameter history", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listTagsForResource(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.ListTagsForResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().ListTagsForResource(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list tags for resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) addTagsToResource(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.AddTagsToResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().AddTagsToResource(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to add tags to resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) removeTagsFromResource(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &ssm.RemoveTagsFromResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().RemoveTagsFromResource(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove tags from resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
