package httphandlers

import (
	"net/http"
	"strconv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/ecs"
	"github.com/aws/aws-sdk-go-v2/service/ecs/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerECSRoutes(r chi.Router) {
	r.Route("/ecs", func(r chi.Router) {
		// Clusters
		r.Get("/clusters", h.ecsListClusters)
		r.Post("/clusters", h.ecsCreateCluster)
		r.Get("/clusters/{cluster}", h.ecsDescribeClusters)
		r.Delete("/clusters/{cluster}", h.ecsDeleteCluster)

		// Task Definitions
		r.Get("/task-definitions", h.ecsListTaskDefinitions)
		r.Post("/task-definitions", h.ecsRegisterTaskDefinition)
		r.Get("/task-definitions/{taskDefinition}", h.ecsDescribeTaskDefinition)
		r.Delete("/task-definitions/{taskDefinition}", h.ecsDeregisterTaskDefinition)
		r.Get("/task-definition-families", h.ecsListTaskDefinitionFamilies)

		// Tasks
		r.Post("/tasks", h.ecsRunTask)
		r.Get("/tasks", h.ecsListTasks)
		r.Get("/tasks/{task:*}", h.ecsDescribeTasks)
		r.Post("/tasks/stop", h.ecsStopTask)

		// Services
		r.Get("/services", h.ecsListServices)
		r.Post("/services", h.ecsCreateService)
		r.Get("/services/{service}", h.ecsDescribeServices)
		r.Delete("/services/{service}", h.ecsDeleteService)
	})
}

// ---------------------------------------------------------------------------
// Clusters
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecsListClusters(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		NextToken  string `json:"NextToken"`
		MaxResults int32  `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	// Query params take precedence — the frontend sends list filters as a query string.
	if v := r.URL.Query().Get("NextToken"); v != "" {
		body.NextToken = v
	}
	if v := r.URL.Query().Get("MaxResults"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			body.MaxResults = int32(n)
		}
	}
	input := &ecs.ListClustersInput{}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	result, err := h.Svc.ECS().ListClusters(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list clusters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsCreateCluster(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ecs.CreateClusterInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.ECS().CreateCluster(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create cluster", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDescribeClusters(w http.ResponseWriter, r *http.Request) {
	input := &ecs.DescribeClustersInput{
		Clusters: []string{urlParam(r, "cluster")},
	}
	result, err := h.Svc.ECS().DescribeClusters(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe clusters", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDeleteCluster(w http.ResponseWriter, r *http.Request) {
	input := &ecs.DeleteClusterInput{
		Cluster: aws.String(urlParam(r, "cluster")),
	}
	result, err := h.Svc.ECS().DeleteCluster(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete cluster", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Task Definitions
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecsListTaskDefinitions(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		FamilyPrefix string `json:"FamilyPrefix"`
		Status       string `json:"Status"`
		Sort         string `json:"Sort"`
		NextToken    string `json:"NextToken"`
		MaxResults   int32  `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	// Query params take precedence — the frontend sends list filters as a query string.
	if v := r.URL.Query().Get("FamilyPrefix"); v != "" {
		body.FamilyPrefix = v
	}
	if v := r.URL.Query().Get("Status"); v != "" {
		body.Status = v
	}
	if v := r.URL.Query().Get("Sort"); v != "" {
		body.Sort = v
	}
	if v := r.URL.Query().Get("NextToken"); v != "" {
		body.NextToken = v
	}
	if v := r.URL.Query().Get("MaxResults"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			body.MaxResults = int32(n)
		}
	}
	input := &ecs.ListTaskDefinitionsInput{}
	if body.FamilyPrefix != "" {
		input.FamilyPrefix = aws.String(body.FamilyPrefix)
	}
	if body.Status != "" {
		input.Status = types.TaskDefinitionStatus(body.Status)
	}
	if body.Sort != "" {
		input.Sort = types.SortOrder(body.Sort)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	result, err := h.Svc.ECS().ListTaskDefinitions(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list task definitions", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsRegisterTaskDefinition(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ecs.RegisterTaskDefinitionInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.ECS().RegisterTaskDefinition(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to register task definition", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDescribeTaskDefinition(w http.ResponseWriter, r *http.Request) {
	input := &ecs.DescribeTaskDefinitionInput{
		TaskDefinition: aws.String(urlParam(r, "taskDefinition")),
	}
	result, err := h.Svc.ECS().DescribeTaskDefinition(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe task definition", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDeregisterTaskDefinition(w http.ResponseWriter, r *http.Request) {
	input := &ecs.DeregisterTaskDefinitionInput{
		TaskDefinition: aws.String(urlParam(r, "taskDefinition")),
	}
	result, err := h.Svc.ECS().DeregisterTaskDefinition(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to deregister task definition", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsListTaskDefinitionFamilies(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		FamilyPrefix string `json:"FamilyPrefix"`
		Status       string `json:"Status"`
		NextToken    string `json:"NextToken"`
		MaxResults   int32  `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	// Query params take precedence — the frontend sends list filters as a query string.
	if v := r.URL.Query().Get("FamilyPrefix"); v != "" {
		body.FamilyPrefix = v
	}
	if v := r.URL.Query().Get("Status"); v != "" {
		body.Status = v
	}
	if v := r.URL.Query().Get("NextToken"); v != "" {
		body.NextToken = v
	}
	if v := r.URL.Query().Get("MaxResults"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			body.MaxResults = int32(n)
		}
	}
	input := &ecs.ListTaskDefinitionFamiliesInput{}
	if body.FamilyPrefix != "" {
		input.FamilyPrefix = aws.String(body.FamilyPrefix)
	}
	if body.Status != "" {
		input.Status = types.TaskDefinitionFamilyStatus(body.Status)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	result, err := h.Svc.ECS().ListTaskDefinitionFamilies(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list task definition families", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecsRunTask(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ecs.RunTaskInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.ECS().RunTask(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to run task", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsListTasks(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Cluster     string `json:"Cluster"`
		Family      string `json:"Family"`
		ServiceName string `json:"ServiceName"`
		Status      string `json:"Status"`
		NextToken   string `json:"NextToken"`
		MaxResults  int32  `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	// Query params take precedence — the frontend sends list filters as a query string.
	if v := r.URL.Query().Get("Cluster"); v != "" {
		body.Cluster = v
	}
	if v := r.URL.Query().Get("Family"); v != "" {
		body.Family = v
	}
	if v := r.URL.Query().Get("ServiceName"); v != "" {
		body.ServiceName = v
	}
	if v := r.URL.Query().Get("Status"); v != "" {
		body.Status = v
	}
	if v := r.URL.Query().Get("NextToken"); v != "" {
		body.NextToken = v
	}
	if v := r.URL.Query().Get("MaxResults"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			body.MaxResults = int32(n)
		}
	}
	input := &ecs.ListTasksInput{}
	if body.Cluster != "" {
		input.Cluster = aws.String(body.Cluster)
	}
	if body.Family != "" {
		input.Family = aws.String(body.Family)
	}
	if body.ServiceName != "" {
		input.ServiceName = aws.String(body.ServiceName)
	}
	if body.Status != "" {
		input.DesiredStatus = types.DesiredStatus(body.Status)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	result, err := h.Svc.ECS().ListTasks(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list tasks", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDescribeTasks(w http.ResponseWriter, r *http.Request) {
	input := &ecs.DescribeTasksInput{
		Tasks: []string{urlParam(r, "task")},
	}
	if v := r.URL.Query().Get("Cluster"); v != "" {
		input.Cluster = aws.String(v)
	}
	result, err := h.Svc.ECS().DescribeTasks(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe tasks", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsStopTask(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ecs.StopTaskInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.ECS().StopTask(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to stop task", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

func (h *ProxyHandler) ecsListServices(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Cluster    string `json:"Cluster"`
		NextToken  string `json:"NextToken"`
		MaxResults int32  `json:"MaxResults"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	// Query params take precedence — the frontend sends list filters as a query string.
	if v := r.URL.Query().Get("Cluster"); v != "" {
		body.Cluster = v
	}
	if v := r.URL.Query().Get("NextToken"); v != "" {
		body.NextToken = v
	}
	if v := r.URL.Query().Get("MaxResults"); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			body.MaxResults = int32(n)
		}
	}
	input := &ecs.ListServicesInput{}
	if body.Cluster != "" {
		input.Cluster = aws.String(body.Cluster)
	}
	if body.NextToken != "" {
		input.NextToken = aws.String(body.NextToken)
	}
	if body.MaxResults > 0 {
		input.MaxResults = aws.Int32(body.MaxResults)
	}
	result, err := h.Svc.ECS().ListServices(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to list services", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsCreateService(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &ecs.CreateServiceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.ECS().CreateService(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to create service", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDescribeServices(w http.ResponseWriter, r *http.Request) {
	input := &ecs.DescribeServicesInput{
		Services: []string{urlParam(r, "service")},
	}
	if v := r.URL.Query().Get("Cluster"); v != "" {
		input.Cluster = aws.String(v)
	}
	result, err := h.Svc.ECS().DescribeServices(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to describe services", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) ecsDeleteService(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var body struct {
		Cluster string `json:"Cluster"`
		Force   bool   `json:"Force"`
	}
	if err := parseBody(bodyBytes, &body); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input := &ecs.DeleteServiceInput{
		Service: aws.String(urlParam(r, "service")),
	}
	if body.Cluster != "" {
		input.Cluster = aws.String(body.Cluster)
	}
	if body.Force {
		input.Force = aws.Bool(true)
	}
	result, err := h.Svc.ECS().DeleteService(h.ctx, input)
	if err != nil {
		sendErrorWithStatus(w, "Failed to delete service", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
