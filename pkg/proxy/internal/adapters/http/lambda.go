package httphandlers

import (
	"context"
	"encoding/base64"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/service/lambda"
)

func (h *ProxyHandler) handleLambda(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	case strings.Contains(xAmzTarget, "ListFunctions"):
		h.listFunctions(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateFunction"):
		h.createFunction(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetFunction"):
		h.getFunction(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteFunction"):
		h.deleteFunction(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "Invoke"):
		h.invokeFunction(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateFunctionConfiguration"):
		h.updateFunctionConfiguration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateFunctionCode"):
		h.updateFunctionCode(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetFunctionConfiguration"):
		h.getFunctionConfiguration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ListEventSourceMappings"):
		h.listEventSourceMappings(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateEventSourceMapping"):
		h.createEventSourceMapping(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetEventSourceMapping"):
		h.getEventSourceMapping(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteEventSourceMapping"):
		h.deleteEventSourceMapping(ctx, w, r, bodyBytes)
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown Lambda action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listFunctions(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.ListFunctionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().ListFunctions(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list functions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createFunction(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.CreateFunctionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().CreateFunction(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create function", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getFunction(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.GetFunctionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().GetFunction(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get function", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteFunction(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.DeleteFunctionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().DeleteFunction(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete function", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) invokeFunction(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.InvokeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().Invoke(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to invoke function", err)
		return
	}

	response := map[string]interface{}{
		"StatusCode": result.StatusCode,
	}
	if result.FunctionError != nil {
		response["FunctionError"] = *result.FunctionError
		w.Header().Set("X-Amz-Function-Error", *result.FunctionError)
	}
	if len(result.Payload) > 0 {
		encoded := base64.StdEncoding.EncodeToString(result.Payload)
		response["Payload"] = encoded
	}
	w.Header().Set("Content-Type", "application/json")
	writeJSON(w, http.StatusOK, response)
}

func (h *ProxyHandler) updateFunctionConfiguration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.UpdateFunctionConfigurationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().UpdateFunctionConfiguration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update function configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateFunctionCode(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.UpdateFunctionCodeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().UpdateFunctionCode(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update function code", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getFunctionConfiguration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.GetFunctionConfigurationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().GetFunctionConfiguration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get function configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listEventSourceMappings(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.ListEventSourceMappingsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().ListEventSourceMappings(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list event source mappings", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createEventSourceMapping(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.CreateEventSourceMappingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().CreateEventSourceMapping(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create event source mapping", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getEventSourceMapping(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.GetEventSourceMappingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().GetEventSourceMapping(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get event source mapping", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteEventSourceMapping(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &lambda.DeleteEventSourceMappingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().DeleteEventSourceMapping(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete event source mapping", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
