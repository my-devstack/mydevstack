package httphandlers

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/apigateway"
	apigwTypes "github.com/aws/aws-sdk-go-v2/service/apigateway/types"
	"github.com/aws/aws-sdk-go-v2/service/apigatewayv2"
	apigwV2Types "github.com/aws/aws-sdk-go-v2/service/apigatewayv2/types"
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerAPIGatewayRoutes(r chi.Router) {
	r.Route("/apigateway", func(r chi.Router) {
		// V2 HTTP APIs
		r.Get("/apis", h.getApis)
		r.Post("/apis", h.createApi)
		r.Get("/apis/{apiId}", h.getApi)
		r.Delete("/apis/{apiId}", h.deleteApi)
		r.Get("/apis/{apiId}/routes", h.getRoutes)
		r.Get("/apis/{apiId}/routes/{routeId}", h.getRoute)
		r.Post("/apis/{apiId}/routes", h.createRoute)
		r.Put("/apis/{apiId}/routes/{routeId}", h.updateRoute)
		r.Delete("/apis/{apiId}/routes/{routeId}", h.deleteRoute)
		r.Get("/apis/{apiId}/integrations", h.getIntegrationsV2)
		r.Post("/apis/{apiId}/integrations", h.createIntegrationV2)
		r.Put("/apis/{apiId}/integrations/{integrationId}", h.updateIntegrationV2)
		r.Delete("/apis/{apiId}/integrations/{integrationId}", h.deleteIntegrationV2)
		r.Get("/apis/{apiId}/stages", h.getStagesV2)
		r.Post("/apis/{apiId}/stages", h.createStageV2)
		r.Put("/apis/{apiId}/stages/{stageName}", h.updateStageV2)
		r.Delete("/apis/{apiId}/stages/{stageName}", h.deleteStageV2)
		r.Get("/apis/{apiId}/stages/{stageName}", h.getStageV2)
		r.Post("/apis/{apiId}/invoke-url", h.getInvokeUrlV2)
		r.Get("/apis/{apiId}/authorizers", h.getAuthorizersV2)
		r.Post("/apis/{apiId}/authorizers", h.createAuthorizerV2)
		r.Get("/apis/{apiId}/authorizers/{authorizerId}", h.getAuthorizerV2)
		r.Put("/apis/{apiId}/authorizers/{authorizerId}", h.updateAuthorizerV2)
		r.Delete("/apis/{apiId}/authorizers/{authorizerId}", h.deleteAuthorizerV2)

		// V1 REST APIs
		r.Get("/rest-apis", h.getRestApis)
		r.Post("/rest-apis", h.createRestApi)
		r.Put("/rest-apis/{restApiId}", h.updateRestApi)
		r.Get("/rest-apis/{restApiId}", h.getRestApi)
		r.Delete("/rest-apis/{restApiId}", h.deleteRestApi)
		r.Post("/rest-apis/{restApiId}/import", h.importRestApi)

		r.Get("/rest-apis/{restApiId}/resources", h.getResources)
		r.Get("/rest-apis/{restApiId}/resources/{resourceId}", h.getResource)
		r.Post("/rest-apis/{restApiId}/resources", h.createResource)
		r.Delete("/rest-apis/{restApiId}/resources/{resourceId}", h.deleteResource)

		r.Put("/rest-apis/{restApiId}/resources/{resourceId}/methods/{httpMethod}", h.putMethod)
		r.Get("/rest-apis/{restApiId}/resources/{resourceId}/methods/{httpMethod}", h.getMethod)
		r.Delete("/rest-apis/{restApiId}/resources/{resourceId}/methods/{httpMethod}", h.deleteMethod)

		r.Put("/rest-apis/{restApiId}/resources/{resourceId}/methods/{httpMethod}/integrations", h.putIntegration)
		r.Get("/rest-apis/{restApiId}/resources/{resourceId}/methods/{httpMethod}/integrations", h.getIntegration)
		r.Delete("/rest-apis/{restApiId}/resources/{resourceId}/methods/{httpMethod}/integrations", h.deleteIntegration)

		r.Post("/rest-apis/{restApiId}/deployments", h.createDeployment)
		r.Get("/rest-apis/{restApiId}/deployments", h.getDeployments)
		r.Delete("/rest-apis/{restApiId}/deployments/{deploymentId}", h.deleteDeployment)

		r.Post("/rest-apis/{restApiId}/stages", h.createStage)
		r.Get("/rest-apis/{restApiId}/stages", h.getStages)
		r.Put("/rest-apis/{restApiId}/stages/{stageName}", h.updateStage)
		r.Delete("/rest-apis/{restApiId}/stages/{stageName}", h.deleteStage)
		r.Post("/rest-apis/{restApiId}/invoke-url", h.getInvokeUrl)
		r.Get("/rest-apis/{restApiId}/authorizers", h.getAuthorizers)
		r.Post("/rest-apis/{restApiId}/authorizers", h.createAuthorizer)
		r.Get("/rest-apis/{restApiId}/authorizers/{authorizerId}", h.getAuthorizer)
		r.Put("/rest-apis/{restApiId}/authorizers/{authorizerId}", h.updateAuthorizer)
		r.Delete("/rest-apis/{restApiId}/authorizers/{authorizerId}", h.deleteAuthorizer)
	})
}

func (h *ProxyHandler) getRestApis(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	log.Printf("getRestApis called with body: %s", string(bodyBytes))
	input := &apigateway.GetRestApisInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		log.Printf("getRestApis parse error: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetRestApis(h.ctx, input)
	if err != nil {
		log.Printf("getRestApis error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to get REST APIs", err)
		return
	}
	log.Printf("getRestApis result type: %T", result)
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRestApi(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.CreateRestApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateRestApi(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) importRestApi(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	log.Printf("ImportRestApi received %d bytes", len(bodyBytes))

	// Check if body is JSON with "body" field (base64 encoded)
	var bodyData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &bodyData); err == nil {
		if body, ok := bodyData["body"].(string); ok {
			// Decode base64
			decoded, err := base64.StdEncoding.DecodeString(body)
			if err != nil {
				log.Printf("ImportRestApi: base64 decode failed: %v", err)
				decoded = []byte(body)
			}
			log.Printf("ImportRestApi: Using base64 decoded body (%d bytes)", len(decoded))

			input := &apigateway.ImportRestApiInput{
				Body: decoded,
			}
			result, err := h.Svc.APIGateway().ImportRestApi(h.ctx, input)
			if err != nil {
				log.Printf("ImportRestApi error (base64): %v", err)
				sendError(w, http.StatusInternalServerError, "Failed to import REST API", err)
				return
			}
			writeJSON(w, http.StatusOK, result)
			return
		}
	}

	// Check if body looks like Swagger JSON (starts with {)
	if len(bodyBytes) > 0 && bodyBytes[0] == byte('{') {
		log.Printf("ImportRestApi: Detected JSON Swagger spec")
		input := &apigateway.ImportRestApiInput{
			Body: bodyBytes,
		}
		result, err := h.Svc.APIGateway().ImportRestApi(h.ctx, input)
		if err != nil {
			log.Printf("ImportRestApi error (JSON): %v", err)
			sendError(w, http.StatusInternalServerError, "Failed to import REST API", err)
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	// Try raw body
	log.Printf("ImportRestApi: Using raw body (%d bytes)", len(bodyBytes))
	input := &apigateway.ImportRestApiInput{
		Body: bodyBytes,
	}
	result, err := h.Svc.APIGateway().ImportRestApi(h.ctx, input)
	if err != nil {
		log.Printf("ImportRestApi error (raw): %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to import REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRestApi(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.DeleteRestApiInput{
		RestApiId: aws.String(chi.URLParam(r, "restApiId")),
	}
	result, err := h.Svc.APIGateway().DeleteRestApi(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRestApi(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetRestApiInput{
		RestApiId: aws.String(chi.URLParam(r, "restApiId")),
	}
	log.Printf("GetRestApi input: RestApiId=%s", *input.RestApiId)

	result, err := h.Svc.APIGateway().GetRestApi(h.ctx, input)
	if err != nil {
		log.Printf("GetRestApi error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to get REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateRestApi(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	log.Printf("UpdateRestApi body: %s", string(bodyBytes))

	var bodyData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		log.Printf("UpdateRestApi: json unmarshal error: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	log.Printf("UpdateRestApi bodyData: %+v", bodyData)

	// Check if it's using AWS SDK format (array of patch operations) vs simple format (name/description fields)
	if nameVal, hasName := bodyData["name"]; hasName {
		log.Printf("UpdateRestApi: using simple format")
		patchOperations := []apigwTypes.PatchOperation{}

		if name, ok := nameVal.(string); ok && name != "" {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/name"),
				Value: aws.String(name),
			})
		}

		var desc string
		hasDesc := false
		if descVal, ok := bodyData["Description"].(string); ok {
			desc = descVal
			hasDesc = true
		} else if descVal, ok := bodyData["description"].(string); ok {
			desc = descVal
			hasDesc = true
		}
		if hasDesc {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/description"),
				Value: aws.String(desc),
			})
		}

		input := &apigateway.UpdateRestApiInput{
			RestApiId:       aws.String(chi.URLParam(r, "restApiId")),
			PatchOperations: patchOperations,
		}

		result, err := h.Svc.APIGateway().UpdateRestApi(h.ctx, input)
		if err != nil {
			log.Printf("UpdateRestApi error: %v", err)
			sendError(w, http.StatusInternalServerError, "Failed to update REST API", err)
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	// AWS SDK format with patchOperations array
	log.Printf("UpdateRestApi: using AWS SDK patchOperations format")
	input := &apigateway.UpdateRestApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	result, err := h.Svc.APIGateway().UpdateRestApi(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getResources(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetResourcesInput{
		RestApiId: aws.String(chi.URLParam(r, "restApiId")),
	}
	result, err := h.Svc.APIGateway().GetResources(h.ctx, input)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "NotFoundException") || strings.Contains(errStr, "not found") || strings.Contains(errStr, "Invalid API") {
			writeJSON(w, http.StatusOK, map[string]interface{}{"items": []interface{}{}, "item": []interface{}{}})
			return
		}
		sendError(w, http.StatusInternalServerError, "Failed to get resources", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getResource(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetResourceInput{
		RestApiId:  aws.String(chi.URLParam(r, "restApiId")),
		ResourceId: aws.String(chi.URLParam(r, "resourceId")),
	}
	result, err := h.Svc.APIGateway().GetResource(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createResource(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	log.Printf("createResource body: %s", string(bodyBytes))

	input := &apigateway.CreateResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		log.Printf("createResource parse error: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	log.Printf("createResource input: RestApiId=%s, ParentId=%s, PathPart=%s",
		aws.ToString(input.RestApiId), aws.ToString(input.ParentId), aws.ToString(input.PathPart))

	result, err := h.Svc.APIGateway().CreateResource(h.ctx, input)
	if err != nil {
		log.Printf("createResource error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to create resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteResource(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.DeleteResourceInput{
		RestApiId:  aws.String(chi.URLParam(r, "restApiId")),
		ResourceId: aws.String(chi.URLParam(r, "resourceId")),
	}
	result, err := h.Svc.APIGateway().DeleteResource(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMethod(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.PutMethodInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	input.ResourceId = aws.String(chi.URLParam(r, "resourceId"))
	input.HttpMethod = aws.String(chi.URLParam(r, "httpMethod"))
	result, err := h.Svc.APIGateway().PutMethod(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put method", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getMethod(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetMethodInput{
		RestApiId:  aws.String(chi.URLParam(r, "restApiId")),
		ResourceId: aws.String(chi.URLParam(r, "resourceId")),
		HttpMethod: aws.String(chi.URLParam(r, "httpMethod")),
	}
	result, err := h.Svc.APIGateway().GetMethod(h.ctx, input)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "NotFound") || strings.Contains(errStr, "not found") {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "Method not found"})
			return
		}
		log.Printf("GetMethod error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to get method", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteMethod(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.DeleteMethodInput{
		RestApiId:  aws.String(chi.URLParam(r, "restApiId")),
		ResourceId: aws.String(chi.URLParam(r, "resourceId")),
		HttpMethod: aws.String(chi.URLParam(r, "httpMethod")),
	}
	result, err := h.Svc.APIGateway().DeleteMethod(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete method", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putIntegration(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.PutIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	input.ResourceId = aws.String(chi.URLParam(r, "resourceId"))
	input.HttpMethod = aws.String(chi.URLParam(r, "httpMethod"))
	log.Printf("PutIntegration input: %+v", input)
	result, err := h.Svc.APIGateway().PutIntegration(h.ctx, input)
	if err != nil {
		log.Printf("PutIntegration error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to put integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getIntegration(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetIntegrationInput{
		RestApiId:  aws.String(chi.URLParam(r, "restApiId")),
		ResourceId: aws.String(chi.URLParam(r, "resourceId")),
		HttpMethod: aws.String(chi.URLParam(r, "httpMethod")),
	}
	result, err := h.Svc.APIGateway().GetIntegration(h.ctx, input)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "NotFound") || strings.Contains(errStr, "not found") || strings.Contains(errStr, "Invalid integration") {
			writeJSON(w, http.StatusNotFound, map[string]string{"message": "Integration not found"})
			return
		}
		log.Printf("GetIntegration error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to get integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteIntegration(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.DeleteIntegrationInput{
		RestApiId:  aws.String(chi.URLParam(r, "restApiId")),
		ResourceId: aws.String(chi.URLParam(r, "resourceId")),
		HttpMethod: aws.String(chi.URLParam(r, "httpMethod")),
	}
	result, err := h.Svc.APIGateway().DeleteIntegration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createDeployment(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.CreateDeploymentInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	result, err := h.Svc.APIGateway().CreateDeployment(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create deployment", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteDeployment(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.DeleteDeploymentInput{
		RestApiId:    aws.String(chi.URLParam(r, "restApiId")),
		DeploymentId: aws.String(chi.URLParam(r, "deploymentId")),
	}
	result, err := h.Svc.APIGateway().DeleteDeployment(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete deployment", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getDeployments(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetDeploymentsInput{
		RestApiId: aws.String(chi.URLParam(r, "restApiId")),
	}
	result, err := h.Svc.APIGateway().GetDeployments(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get deployments", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStage(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.CreateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	result, err := h.Svc.APIGateway().CreateStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getStages(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.GetStagesInput{
		RestApiId: aws.String(chi.URLParam(r, "restApiId")),
	}
	result, err := h.Svc.APIGateway().GetStages(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get stages", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateStage(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.UpdateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(chi.URLParam(r, "restApiId"))
	input.StageName = aws.String(chi.URLParam(r, "stageName"))
	result, err := h.Svc.APIGateway().UpdateStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStage(w http.ResponseWriter, r *http.Request) {
	input := &apigateway.DeleteStageInput{
		RestApiId: aws.String(chi.URLParam(r, "restApiId")),
		StageName: aws.String(chi.URLParam(r, "stageName")),
	}
	result, err := h.Svc.APIGateway().DeleteStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// HTTP API v2 (ApiGatewayV2) handlers
func (h *ProxyHandler) getApis(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.GetApisInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetApis(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get HTTP APIs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createApi(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.CreateApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Default ProtocolType to HTTP if not provided
	if input.ProtocolType == "" {
		input.ProtocolType = apigwV2Types.ProtocolTypeHttp
	}

	// RouteSelectionExpression is required for WEBSOCKET protocol
	if input.ProtocolType == apigwV2Types.ProtocolTypeWebsocket && input.RouteSelectionExpression == nil {
		input.RouteSelectionExpression = aws.String("$request.body.action")
	}

	result, err := h.Svc.APIGatewayV2().CreateApi(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteApi(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.DeleteApiInput{
		ApiId: aws.String(chi.URLParam(r, "apiId")),
	}
	result, err := h.Svc.APIGatewayV2().DeleteApi(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete HTTP API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getApi(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.GetApiInput{
		ApiId: aws.String(chi.URLParam(r, "apiId")),
	}
	result, err := h.Svc.APIGatewayV2().GetApi(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get HTTP API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRoutes(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.GetRoutesInput{
		ApiId: aws.String(chi.URLParam(r, "apiId")),
	}
	result, err := h.Svc.APIGatewayV2().GetRoutes(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get routes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRoute(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.GetRouteInput{
		ApiId:   aws.String(chi.URLParam(r, "apiId")),
		RouteId: aws.String(chi.URLParam(r, "routeId")),
	}
	result, err := h.Svc.APIGatewayV2().GetRoute(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRoute(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.CreateRouteInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.ApiId = aws.String(chi.URLParam(r, "apiId"))
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateRoute(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRoute(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.DeleteRouteInput{
		ApiId:   aws.String(chi.URLParam(r, "apiId")),
		RouteId: aws.String(chi.URLParam(r, "routeId")),
	}
	result, err := h.Svc.APIGatewayV2().DeleteRoute(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateRoute(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.UpdateRouteInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.ApiId = aws.String(chi.URLParam(r, "apiId"))
	input.RouteId = aws.String(chi.URLParam(r, "routeId"))
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if *input.RouteId == "" {
		sendError(w, http.StatusBadRequest, "RouteId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateRoute(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getIntegrationsV2(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.GetIntegrationsInput{
		ApiId: aws.String(chi.URLParam(r, "apiId")),
	}
	result, err := h.Svc.APIGatewayV2().GetIntegrations(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get integrations", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createIntegrationV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.CreateIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.ApiId = aws.String(chi.URLParam(r, "apiId"))
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateIntegration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateIntegrationV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.UpdateIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.ApiId = aws.String(chi.URLParam(r, "apiId"))
	input.IntegrationId = aws.String(chi.URLParam(r, "integrationId"))
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if *input.IntegrationId == "" {
		sendError(w, http.StatusBadRequest, "IntegrationId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateIntegration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteIntegrationV2(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.DeleteIntegrationInput{
		ApiId:         aws.String(chi.URLParam(r, "apiId")),
		IntegrationId: aws.String(chi.URLParam(r, "integrationId")),
	}
	result, err := h.Svc.APIGatewayV2().DeleteIntegration(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// HTTP API v2 Stage handlers
func (h *ProxyHandler) getStagesV2(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.GetStagesInput{
		ApiId: aws.String(chi.URLParam(r, "apiId")),
	}
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetStages(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get stages", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getStageV2(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.GetStageInput{
		ApiId:     aws.String(chi.URLParam(r, "apiId")),
		StageName: aws.String(chi.URLParam(r, "stageName")),
	}
	result, err := h.Svc.APIGatewayV2().GetStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStageV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.CreateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.ApiId = aws.String(chi.URLParam(r, "apiId"))
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateStageV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.UpdateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.ApiId = aws.String(chi.URLParam(r, "apiId"))
	input.StageName = aws.String(chi.URLParam(r, "stageName"))
	if *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if *input.StageName == "" {
		sendError(w, http.StatusBadRequest, "StageName is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStageV2(w http.ResponseWriter, r *http.Request) {
	input := &apigatewayv2.DeleteStageInput{
		ApiId:     aws.String(chi.URLParam(r, "apiId")),
		StageName: aws.String(chi.URLParam(r, "stageName")),
	}
	result, err := h.Svc.APIGatewayV2().DeleteStage(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getInvokeUrl(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var bodyData struct {
		ApiID     string `json:"apiId"`
		StageName string `json:"stageName"`
	}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	url, err := h.Svc.APIGateway().GetInvokeUrl(h.ctx, bodyData.ApiID, bodyData.StageName)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get invoke URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"invokeUrl": url})
}

func (h *ProxyHandler) getInvokeUrlV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	var bodyData struct {
		ApiID        string `json:"apiId"`
		StageName    string `json:"stageName"`
		ProtocolType string `json:"protocolType"`
	}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	protocolType := bodyData.ProtocolType
	if protocolType == "" {
		protocolType = "HTTP"
	}
	url, err := h.Svc.APIGatewayV2().GetInvokeUrl(h.ctx, bodyData.ApiID, bodyData.StageName, protocolType)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get invoke URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"invokeUrl": url})
}

// REST API v1 Authorizer handlers
func (h *ProxyHandler) getAuthorizers(w http.ResponseWriter, r *http.Request) {
	restApiId := chi.URLParam(r, "restApiId")
	if restApiId == "" {
		sendError(w, http.StatusBadRequest, "RestApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGateway().GetAuthorizers(h.ctx, restApiId)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get authorizers", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": result})
}

func (h *ProxyHandler) getAuthorizer(w http.ResponseWriter, r *http.Request) {
	restApiId := chi.URLParam(r, "restApiId")
	authorizerId := chi.URLParam(r, "authorizerId")
	if restApiId == "" {
		sendError(w, http.StatusBadRequest, "RestApiId is required", nil)
		return
	}
	if authorizerId == "" {
		sendError(w, http.StatusBadRequest, "AuthorizerId is required", nil)
		return
	}
	result, err := h.Svc.APIGateway().GetAuthorizer(h.ctx, restApiId, authorizerId)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createAuthorizer(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigateway.CreateAuthorizerInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	restApiId := chi.URLParam(r, "restApiId")
	if restApiId == "" {
		sendError(w, http.StatusBadRequest, "RestApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGateway().CreateAuthorizer(h.ctx, restApiId, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateAuthorizer(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)

	var bodyData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	restApiId := chi.URLParam(r, "restApiId")
	authorizerId := chi.URLParam(r, "authorizerId")
	if restApiId == "" {
		sendError(w, http.StatusBadRequest, "RestApiId is required", nil)
		return
	}
	if authorizerId == "" {
		sendError(w, http.StatusBadRequest, "AuthorizerId is required", nil)
		return
	}

	// Simple format: {Name, Type, AuthorizerUri, AuthorizerCredentials, IdentitySource}.
	// v1 UpdateAuthorizerInput has no Name/Type fields — it uses PatchOperations.
	// Authorizer Type is immutable after creation (AWS rejects /type patch), so it is skipped.
	if _, hasName := bodyData["Name"]; hasName {
		patchOperations := []apigwTypes.PatchOperation{}

		if name, ok := bodyData["Name"].(string); ok && name != "" {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/name"),
				Value: aws.String(name),
			})
		}
		if uri, ok := bodyData["AuthorizerUri"].(string); ok && uri != "" {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/authorizerUri"),
				Value: aws.String(uri),
			})
		}
		if creds, ok := bodyData["AuthorizerCredentials"].(string); ok && creds != "" {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/authorizerCredentials"),
				Value: aws.String(creds),
			})
		}
		if idSrc, ok := bodyData["IdentitySource"].(string); ok && idSrc != "" {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/identitySource"),
				Value: aws.String(idSrc),
			})
		}

		input := &apigateway.UpdateAuthorizerInput{
			RestApiId:       aws.String(restApiId),
			AuthorizerId:    aws.String(authorizerId),
			PatchOperations: patchOperations,
		}
		result, err := h.Svc.APIGateway().UpdateAuthorizer(h.ctx, restApiId, authorizerId, input)
		if err != nil {
			sendError(w, http.StatusInternalServerError, "Failed to update authorizer", err)
			return
		}
		writeJSON(w, http.StatusOK, result)
		return
	}

	// AWS SDK format with patchOperations array
	input := &apigateway.UpdateAuthorizerInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.RestApiId = aws.String(restApiId)
	input.AuthorizerId = aws.String(authorizerId)
	result, err := h.Svc.APIGateway().UpdateAuthorizer(h.ctx, restApiId, authorizerId, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAuthorizer(w http.ResponseWriter, r *http.Request) {
	restApiId := chi.URLParam(r, "restApiId")
	authorizerId := chi.URLParam(r, "authorizerId")
	if restApiId == "" {
		sendError(w, http.StatusBadRequest, "RestApiId is required", nil)
		return
	}
	if authorizerId == "" {
		sendError(w, http.StatusBadRequest, "AuthorizerId is required", nil)
		return
	}
	err := h.Svc.APIGateway().DeleteAuthorizer(h.ctx, restApiId, authorizerId)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Authorizer deleted"})
}

// HTTP API v2 Authorizer handlers
func (h *ProxyHandler) getAuthorizersV2(w http.ResponseWriter, r *http.Request) {
	apiId := chi.URLParam(r, "apiId")
	if apiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetAuthorizers(h.ctx, apiId)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get authorizers", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": result})
}

func (h *ProxyHandler) getAuthorizerV2(w http.ResponseWriter, r *http.Request) {
	apiId := chi.URLParam(r, "apiId")
	authorizerId := chi.URLParam(r, "authorizerId")
	if apiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if authorizerId == "" {
		sendError(w, http.StatusBadRequest, "AuthorizerId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetAuthorizer(h.ctx, apiId, authorizerId)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createAuthorizerV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.CreateAuthorizerInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if len(input.IdentitySource) == 0 {
		input.IdentitySource = []string{"$request.header.Authorization"}
	}
	log.Printf("CreateAuthorizerV2: AuthorizerType=%v, JwtConfiguration=%v, IdentitySource=%v", input.AuthorizerType, input.JwtConfiguration, input.IdentitySource)
	apiId := chi.URLParam(r, "apiId")
	if apiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateAuthorizer(h.ctx, apiId, input)
	if err != nil {
		log.Printf("CreateAuthorizerV2 error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to create authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateAuthorizerV2(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &apigatewayv2.UpdateAuthorizerInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if len(input.IdentitySource) == 0 {
		input.IdentitySource = []string{"$request.header.Authorization"}
	}
	log.Printf("UpdateAuthorizerV2: AuthorizerType=%v, JwtConfiguration=%v, IdentitySource=%v", input.AuthorizerType, input.JwtConfiguration, input.IdentitySource)
	apiId := chi.URLParam(r, "apiId")
	authorizerId := chi.URLParam(r, "authorizerId")
	if apiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if authorizerId == "" {
		sendError(w, http.StatusBadRequest, "AuthorizerId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateAuthorizer(h.ctx, apiId, authorizerId, input)
	if err != nil {
		log.Printf("UpdateAuthorizerV2 error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to update authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteAuthorizerV2(w http.ResponseWriter, r *http.Request) {
	apiId := chi.URLParam(r, "apiId")
	authorizerId := chi.URLParam(r, "authorizerId")
	if apiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if authorizerId == "" {
		sendError(w, http.StatusBadRequest, "AuthorizerId is required", nil)
		return
	}
	err := h.Svc.APIGatewayV2().DeleteAuthorizer(h.ctx, apiId, authorizerId)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete authorizer", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Authorizer deleted"})
}
