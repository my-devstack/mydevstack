package httphandlers

import (
	"context"
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
)

func (h *ProxyHandler) handleAPIGateway(w http.ResponseWriter, r *http.Request) {
	xAmzTarget := r.Header.Get("X-Amz-Target")
	bodyBytes := readBody(r)
	ctx := h.ctx

	switch {
	// HTTP API v2 operations (must be before REST API operations)
	case strings.Contains(xAmzTarget, "GetApis"):
		h.getApis(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateApi"):
		h.createApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteApi"):
		h.deleteApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetApi"):
		h.getApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRoutes"):
		h.getRoutes(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateRoute"):
		h.createRoute(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateRoute"):
		h.updateRoute(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteRoute"):
		h.deleteRoute(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetIntegrations"):
		h.getIntegrationsV2(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateIntegration"): // HTTP API v2 - must be after CreateRoute
		h.createIntegrationV2(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateIntegration"):
		h.updateIntegrationV2(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteIntegration"): // HTTP API v2
		h.deleteIntegrationV2(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetStages"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.getStagesV2(ctx, w, r, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.getStages(ctx, w, r, bodyBytes)
		} else {
			h.getStagesV2(ctx, w, r, bodyBytes)
		}
	case strings.Contains(xAmzTarget, "GetStage"):
		h.getStageV2(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateStage"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.createStageV2(ctx, w, r, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.createStage(ctx, w, r, bodyBytes)
		} else {
			h.createStageV2(ctx, w, r, bodyBytes)
		}
	case strings.Contains(xAmzTarget, "UpdateStage"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.updateStageV2(ctx, w, r, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.updateStage(ctx, w, r, bodyBytes)
		} else {
			h.updateStageV2(ctx, w, r, bodyBytes)
		}
	case strings.Contains(xAmzTarget, "DeleteStage"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.deleteStageV2(ctx, w, r, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.deleteStage(ctx, w, r, bodyBytes)
		} else {
			h.deleteStageV2(ctx, w, r, bodyBytes)
		}

	// REST API v1 operations
	case strings.Contains(xAmzTarget, "GetRestApis"):
		h.getRestApis(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateRestApi"):
		h.createRestApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteRestApi"):
		h.deleteRestApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRestApi"):
		h.getRestApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateRestApi"):
		h.updateRestApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetResources"):
		h.getResources(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetResource"):
		h.getResource(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateResource"):
		h.createResource(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteResource"):
		h.deleteResource(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMethod"):
		h.putMethod(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetMethod"):
		h.getMethod(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteMethod"):
		h.deleteMethod(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "PutIntegration"):
		h.putIntegration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetIntegration"): // REST API v1 handler
		h.getIntegration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteIntegration") && strings.HasPrefix(xAmzTarget, "APIGateway."): // REST API v1
		h.deleteIntegration(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateDeployment"):
		h.createDeployment(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteDeployment"):
		h.deleteDeployment(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetDeployments"):
		h.getDeployments(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateStage"):
		h.createStage(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetStages"):
		h.getStages(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateStage"):
		h.updateStage(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteStage"):
		h.deleteStage(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "ImportRestApi"):
		h.importRestApi(ctx, w, r, bodyBytes)
	case strings.Contains(xAmzTarget, "GetInvokeUrl"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.getInvokeUrlV2(ctx, w, r, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.getInvokeUrl(ctx, w, r, bodyBytes)
		} else {
			h.getInvokeUrlV2(ctx, w, r, bodyBytes)
		}
	default:
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Unknown API Gateway action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) getRestApis(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	log.Printf("getRestApis called with body: %s", string(bodyBytes))
	input := &apigateway.GetRestApisInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		log.Printf("getRestApis parse error: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetRestApis(ctx, input)
	if err != nil {
		log.Printf("getRestApis error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to get REST APIs", err)
		return
	}
	log.Printf("getRestApis result type: %T", result)
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRestApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.CreateRestApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateRestApi(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) importRestApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
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
			result, err := h.Svc.APIGateway().ImportRestApi(ctx, input)
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
		result, err := h.Svc.APIGateway().ImportRestApi(ctx, input)
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
	result, err := h.Svc.APIGateway().ImportRestApi(ctx, input)
	if err != nil {
		log.Printf("ImportRestApi error (raw): %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to import REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRestApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.DeleteRestApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteRestApi(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRestApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	log.Printf("GetRestApi body: %s", string(bodyBytes))

	input := &apigateway.GetRestApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	log.Printf("GetRestApi input: RestApiId=%s", aws.ToString(input.RestApiId))

	result, err := h.Svc.APIGateway().GetRestApi(ctx, input)
	if err != nil {
		log.Printf("GetRestApi error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to get REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateRestApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	log.Printf("UpdateRestApi body: %s", string(bodyBytes))

	var bodyData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		log.Printf("UpdateRestApi: json unmarshal error: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	log.Printf("UpdateRestApi bodyData: %+v", bodyData)

	// Check if it's using AWS SDK format (array of patch operations) vs simple format (name/description fields)
	// The simple format from Vue has "name" and "Description" as top-level fields (uppercase from json serializer)
	// The AWS SDK format has "patchOperations" as an array
	if nameVal, hasName := bodyData["name"]; hasName {
		// Simple format: convert name/description to patch operations
		log.Printf("UpdateRestApi: using simple format")
		patchOperations := []apigwTypes.PatchOperation{}

		if name, ok := nameVal.(string); ok && name != "" {
			patchOperations = append(patchOperations, apigwTypes.PatchOperation{
				Op:    apigwTypes.OpReplace,
				Path:  aws.String("/name"),
				Value: aws.String(name),
			})
		}

		// Handle both "description" (lowercase) and "Description" (uppercase)
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

		restApiId, _ := bodyData["restApiId"].(string)
		input := &apigateway.UpdateRestApiInput{
			RestApiId:       aws.String(restApiId),
			PatchOperations: patchOperations,
		}

		result, err := h.Svc.APIGateway().UpdateRestApi(ctx, input)
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
	result, err := h.Svc.APIGateway().UpdateRestApi(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update REST API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getResources(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.GetResourcesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetResources(ctx, input)
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

func (h *ProxyHandler) getResource(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.GetResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetResource(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createResource(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	log.Printf("createResource body: %s", string(bodyBytes))

	input := &apigateway.CreateResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		log.Printf("createResource parse error: %v", err)
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	log.Printf("createResource input: RestApiId=%s, ParentId=%s, PathPart=%s",
		aws.ToString(input.RestApiId), aws.ToString(input.ParentId), aws.ToString(input.PathPart))

	result, err := h.Svc.APIGateway().CreateResource(ctx, input)
	if err != nil {
		log.Printf("createResource error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to create resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteResource(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.DeleteResourceInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteResource(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete resource", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putMethod(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.PutMethodInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().PutMethod(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put method", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getMethod(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.GetMethodInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetMethod(ctx, input)
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

func (h *ProxyHandler) deleteMethod(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.DeleteMethodInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteMethod(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete method", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putIntegration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.PutIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	log.Printf("PutIntegration input: %+v", input)
	result, err := h.Svc.APIGateway().PutIntegration(ctx, input)
	if err != nil {
		log.Printf("PutIntegration error: %v", err)
		sendError(w, http.StatusInternalServerError, "Failed to put integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getIntegration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.GetIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetIntegration(ctx, input)
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

func (h *ProxyHandler) deleteIntegration(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.DeleteIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteIntegration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createDeployment(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.CreateDeploymentInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateDeployment(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create deployment", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteDeployment(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.DeleteDeploymentInput{}

	var data map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	if v, ok := data["restApiId"]; ok {
		input.RestApiId = aws.String(v.(string))
	}
	if v, ok := data["deploymentId"]; ok {
		input.DeploymentId = aws.String(v.(string))
	}

	result, err := h.Svc.APIGateway().DeleteDeployment(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete deployment", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getDeployments(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.GetDeploymentsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetDeployments(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get deployments", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStage(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.CreateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getStages(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.GetStagesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetStages(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get stages", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateStage(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.UpdateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().UpdateStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStage(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigateway.DeleteStageInput{}
	log.Printf("deleteStage raw body: %s", string(bodyBytes))

	// Parse to map first
	var data map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Map keys to TitleCase
	if v, ok := data["restApiId"]; ok {
		input.RestApiId = aws.String(v.(string))
	}
	if v, ok := data["stageName"]; ok {
		input.StageName = aws.String(v.(string))
	}

	result, err := h.Svc.APIGateway().DeleteStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// HTTP API v2 (ApiGatewayV2) handlers
func (h *ProxyHandler) getApis(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.GetApisInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetApis(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get HTTP APIs", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
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

	result, err := h.Svc.APIGatewayV2().CreateApi(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.DeleteApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteApi(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete HTTP API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getApi(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.GetApiInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetApi(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get HTTP API", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getRoutes(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.GetRoutesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetRoutes(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get routes", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createRoute(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.CreateRouteInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateRoute(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteRoute(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.DeleteRouteInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteRoute(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateRoute(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.UpdateRouteInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if input.RouteId == nil || *input.RouteId == "" {
		sendError(w, http.StatusBadRequest, "RouteId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateRoute(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update route", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getIntegrationsV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.GetIntegrationsInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetIntegrations(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get integrations", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createIntegrationV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.CreateIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateIntegration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateIntegrationV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.UpdateIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if input.IntegrationId == nil || *input.IntegrationId == "" {
		sendError(w, http.StatusBadRequest, "IntegrationId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateIntegration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteIntegrationV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.DeleteIntegrationInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteIntegration(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete integration", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

// HTTP API v2 Stage handlers
func (h *ProxyHandler) getStagesV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.GetStagesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Map lowercase keys to TitleCase
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err == nil {
		if v, ok := data["apiId"]; ok {
			input.ApiId = aws.String(v.(string))
		}
	}

	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}

	result, err := h.Svc.APIGatewayV2().GetStages(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get stages", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getStageV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.GetStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createStageV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.CreateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().CreateStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateStageV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.UpdateStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	if input.ApiId == nil || *input.ApiId == "" {
		sendError(w, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if input.StageName == nil || *input.StageName == "" {
		sendError(w, http.StatusBadRequest, "StageName is required", nil)
		return
	}
	result, err := h.Svc.APIGatewayV2().UpdateStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteStageV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	input := &apigatewayv2.DeleteStageInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteStage(ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete stage", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) getInvokeUrl(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
	var bodyData struct {
		ApiID     string `json:"apiId"`
		StageName string `json:"stageName"`
	}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	url, err := h.Svc.APIGateway().GetInvokeUrl(ctx, bodyData.ApiID, bodyData.StageName)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get invoke URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"invokeUrl": url})
}

func (h *ProxyHandler) getInvokeUrlV2(ctx context.Context, w http.ResponseWriter, r *http.Request, bodyBytes []byte) {
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
	url, err := h.Svc.APIGatewayV2().GetInvokeUrl(ctx, bodyData.ApiID, bodyData.StageName, protocolType)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get invoke URL", err)
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"invokeUrl": url})
}
