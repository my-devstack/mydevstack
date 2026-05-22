package httphandlers

import (
	"net/http"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sfn"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerStepFunctionsRoutes(r chi.Router) {
	r.Route("/step-functions", func(r chi.Router) {
		r.Get("/state-machines", h.listStateMachines)
		r.Post("/state-machines", h.createStateMachine)
		r.Get("/state-machines/{stateMachineArn}", h.describeStateMachine)
		r.Put("/state-machines/{stateMachineArn}", h.updateStateMachine)
		r.Delete("/state-machines/{stateMachineArn}", h.deleteStateMachine)

		r.Post("/state-machines/{stateMachineArn}/executions", h.startExecution)
		r.Get("/state-machines/{stateMachineArn}/executions", h.listExecutions)
		r.Get("/executions/{executionArn}", h.describeExecution)
		r.Get("/executions/{executionArn}/history", h.getExecutionHistory)
		r.Post("/executions/{executionArn}/stop", h.stopExecution)


	})
}

func (h *ProxyHandler) listStateMachines(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sfn.ListStateMachinesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().ListStateMachines(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list state machines", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStateMachine(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sfn.CreateStateMachineInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.StepFunctions().CreateStateMachine(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeStateMachine(w http.ResponseWriter, r *http.Request) {
	input := &sfn.DescribeStateMachineInput{
		StateMachineArn: aws.String(urlParam(r, "stateMachineArn")),
	}
	result, err := h.Svc.StepFunctions().DescribeStateMachine(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateStateMachine(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &sfn.UpdateStateMachineInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.StateMachineArn = aws.String(urlParam(r, "stateMachineArn"))
	result, err := h.Svc.StepFunctions().UpdateStateMachine(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStateMachine(w http.ResponseWriter, r *http.Request) {
	input := &sfn.DeleteStateMachineInput{
		StateMachineArn: aws.String(urlParam(r, "stateMachineArn")),
	}
	result, err := h.Svc.StepFunctions().DeleteStateMachine(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete state machine", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) startExecution(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Input string `json:"Input"`
		Name  string `json:"Name"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &sfn.StartExecutionInput{
		StateMachineArn: aws.String(urlParam(r, "stateMachineArn")),
	}
	if body.Input != "" {
		input.Input = aws.String(body.Input)
	}
	if body.Name != "" {
		input.Name = aws.String(body.Name)
	}
	result, err := h.Svc.StepFunctions().StartExecution(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to start execution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) listExecutions(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		MaxResults int32  `json:"MaxResults"`
		NextToken  string `json:"NextToken"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &sfn.ListExecutionsInput{
		StateMachineArn: aws.String(urlParam(r, "stateMachineArn")),
	}
	if body.MaxResults > 0 {
		input.MaxResults = body.MaxResults
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	result, err := h.Svc.StepFunctions().ListExecutions(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list executions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) stopExecution(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Cause string `json:"Cause"`
		Error string `json:"Error"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &sfn.StopExecutionInput{
		ExecutionArn: aws.String(urlParam(r, "executionArn")),
	}
	if body.Cause != "" {
		input.Cause = aws.String(body.Cause)
	}
	if body.Error != "" {
		input.Error = aws.String(body.Error)
	}
	result, err := h.Svc.StepFunctions().StopExecution(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to stop execution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeExecution(w http.ResponseWriter, r *http.Request) {
	input := &sfn.DescribeExecutionInput{
		ExecutionArn: aws.String(urlParam(r, "executionArn")),
	}
	result, err := h.Svc.StepFunctions().DescribeExecution(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe execution", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getExecutionHistory(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		MaxResults  int32  `json:"MaxResults"`
		NextToken   string `json:"NextToken"`
		ReverseOrder bool  `json:"ReverseOrder"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &sfn.GetExecutionHistoryInput{
		ExecutionArn: aws.String(urlParam(r, "executionArn")),
	}
	if body.MaxResults > 0 {
		input.MaxResults = body.MaxResults
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.ReverseOrder {
		input.ReverseOrder = true
	}
	result, err := h.Svc.StepFunctions().GetExecutionHistory(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get execution history", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

