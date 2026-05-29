package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/cloudformation"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerCloudFormationRoutes(r chi.Router) {
	r.Route("/cloudformation", func(r chi.Router) {
		r.Post("/stacks", h.createStack)
		r.Get("/stacks", h.listStacks)
		r.Get("/stacks/{stackName}", h.describeStacks)
		r.Delete("/stacks/{stackName}", h.deleteStack)
		r.Get("/stacks/{stackName}/template", h.getTemplate)
		r.Get("/stacks/{stackName}/resources", h.listStackResources)
	})
}

func (h *ProxyHandler) listStacks(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudformation.ListStacksInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().ListStacks(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list stacks", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStack(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudformation.CreateStackInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().CreateStack(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stack", err)
		return
	}
	writeJSON(w, http.StatusCreated, result)
}

func (h *ProxyHandler) deleteStack(w http.ResponseWriter, r *http.Request) {
	input := &cloudformation.DeleteStackInput{
		StackName: aws.String(chi.URLParam(r, "stackName")),
	}
	result, err := h.Svc.CloudFormation().DeleteStack(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stack", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStacks(w http.ResponseWriter, r *http.Request) {
	input := &cloudformation.DescribeStacksInput{
		StackName: aws.String(chi.URLParam(r, "stackName")),
	}
	result, err := h.Svc.CloudFormation().DescribeStacks(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe stacks", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getTemplate(w http.ResponseWriter, r *http.Request) {
	input := &cloudformation.GetTemplateInput{
		StackName: aws.String(chi.URLParam(r, "stackName")),
	}
	result, err := h.Svc.CloudFormation().GetTemplate(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get template", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listStackResources(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &cloudformation.ListStackResourcesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.CloudFormation().ListStackResources(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list stack resources", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}


