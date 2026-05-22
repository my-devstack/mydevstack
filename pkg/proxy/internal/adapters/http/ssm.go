package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ssm"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerSSMRoutes(r chi.Router) {
	r.Route("/ssm", func(r chi.Router) {
		r.Get("/parameters", h.describeParameters)
		r.Get("/parameters/{parameterName}", h.getParameter)
		r.Post("/parameters", h.putParameter)
		r.Delete("/parameters/{parameterName}", h.deleteParameter)
		r.Get("/parameters/{parameterName}/history", h.getParameterHistory)
		r.Post("/parameters/batch", h.getParameters)
		r.Get("/parameters-by-path/*", h.getParametersByPath)
		r.Post("/tags", h.addTagsToResource)
		r.Post("/tags/list", h.listTagsForResource)
		r.Post("/tags/delete", h.removeTagsFromResource)
	})
}

func (h *ProxyHandler) getParameter(w http.ResponseWriter, r *http.Request) {
	input := &ssm.GetParameterInput{
		Name: aws.String(urlParam(r, "parameterName")),
	}
	result, err := h.Svc.SSM().GetParameter(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get parameter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getParameters(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ssm.GetParametersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().GetParameters(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get parameters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getParametersByPath(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Recursive bool   `json:"Recursive"`
		MaxResults int32 `json:"MaxResults"`
		NextToken  string `json:"NextToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ssm.GetParametersByPathInput{
		Path: aws.String(urlParam(r, "*")),
	}
	if body.Recursive {
		input.Recursive = aws.Bool(true)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.SSM().GetParametersByPath(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get parameters by path", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putParameter(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ssm.PutParameterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().PutParameter(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put parameter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteParameter(w http.ResponseWriter, r *http.Request) {
	input := &ssm.DeleteParameterInput{
		Name: aws.String(urlParam(r, "parameterName")),
	}
	result, err := h.Svc.SSM().DeleteParameter(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete parameter", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeParameters(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ssm.DescribeParametersInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().DescribeParameters(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe parameters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getParameterHistory(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		MaxResults int32  `json:"MaxResults"`
		NextToken  string `json:"NextToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ssm.GetParameterHistoryInput{
		Name: aws.String(urlParam(r, "parameterName")),
	}
	// Read optional params from query string (FE sends WithDecryption as query param)
	if v := r.URL.Query().Get("WithDecryption"); v == "true" {
		input.WithDecryption = aws.Bool(true)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.SSM().GetParameterHistory(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to get parameter history", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listTagsForResource(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ssm.ListTagsForResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().ListTagsForResource(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list tags for resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) addTagsToResource(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ssm.AddTagsToResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().AddTagsToResource(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to add tags to resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) removeTagsFromResource(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ssm.RemoveTagsFromResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.SSM().RemoveTagsFromResource(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to remove tags from resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
