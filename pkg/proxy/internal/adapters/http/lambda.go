package httphandlers

import (
	"encoding/base64"
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerLambdaRoutes(r chi.Router) {
	r.Route("/lambda", func(r chi.Router) {
		r.Get("/functions", h.listFunctions)
		r.Post("/functions", h.createFunction)
		r.Get("/functions/{functionName}", h.getFunction)
		r.Put("/functions/{functionName}", h.updateFunctionConfiguration)
		r.Put("/functions/{functionName}/code", h.updateFunctionCode)
		r.Delete("/functions/{functionName}", h.deleteFunction)
		r.Post("/functions/{functionName}/invocations", h.invokeFunction)
		r.Get("/functions/{functionName}/configuration", h.getFunctionConfiguration)

		r.Get("/event-source-mappings", h.listEventSourceMappings)
		r.Post("/event-source-mappings", h.createEventSourceMapping)
		r.Get("/event-source-mappings/{uuid}", h.getEventSourceMapping)
		r.Delete("/event-source-mappings/{uuid}", h.deleteEventSourceMapping)
	})
}

func (h *ProxyHandler) listFunctions(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.ListFunctionsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().ListFunctions(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list functions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createFunction(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.CreateFunctionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().CreateFunction(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create function", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getFunction(w http.ResponseWriter, r *http.Request) {
	input := &lambda.GetFunctionInput{
		FunctionName: aws.String(urlParam(r, "functionName")),
	}
	result, err := h.Svc.Lambda().GetFunction(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get function", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteFunction(w http.ResponseWriter, r *http.Request) {
	input := &lambda.DeleteFunctionInput{
		FunctionName: aws.String(urlParam(r, "functionName")),
	}
	result, err := h.Svc.Lambda().DeleteFunction(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete function", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) invokeFunction(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.InvokeInput{
		FunctionName: aws.String(urlParam(r, "functionName")),
	}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().Invoke(h.ctx, input)
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

func (h *ProxyHandler) updateFunctionConfiguration(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.UpdateFunctionConfigurationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.FunctionName = aws.String(urlParam(r, "functionName"))
	result, err := h.Svc.Lambda().UpdateFunctionConfiguration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update function configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateFunctionCode(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.UpdateFunctionCodeInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.FunctionName = aws.String(urlParam(r, "functionName"))
	result, err := h.Svc.Lambda().UpdateFunctionCode(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update function code", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getFunctionConfiguration(w http.ResponseWriter, r *http.Request) {
	input := &lambda.GetFunctionConfigurationInput{
		FunctionName: aws.String(urlParam(r, "functionName")),
	}
	result, err := h.Svc.Lambda().GetFunctionConfiguration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get function configuration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listEventSourceMappings(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.ListEventSourceMappingsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().ListEventSourceMappings(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list event source mappings", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createEventSourceMapping(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &lambda.CreateEventSourceMappingInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.Lambda().CreateEventSourceMapping(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create event source mapping", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getEventSourceMapping(w http.ResponseWriter, r *http.Request) {
	input := &lambda.GetEventSourceMappingInput{
		UUID: aws.String(chi.URLParam(r, "uuid")),
	}
	result, err := h.Svc.Lambda().GetEventSourceMapping(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get event source mapping", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteEventSourceMapping(w http.ResponseWriter, r *http.Request) {
	input := &lambda.DeleteEventSourceMappingInput{
		UUID: aws.String(chi.URLParam(r, "uuid")),
	}
	result, err := h.Svc.Lambda().DeleteEventSourceMapping(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete event source mapping", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
