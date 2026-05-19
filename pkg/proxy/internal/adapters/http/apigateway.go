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
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleAPIGateway(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := h.ctx

	switch {
	// HTTP API v2 operations (must be before REST API operations)
	case strings.Contains(xAmzTarget, "GetApis"):
		h.getApis(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateApi"):
		h.createApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteApi"):
		h.deleteApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetApi"):
		h.getApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRoutes"):
		h.getRoutes(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateRoute"):
		h.createRoute(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateRoute"):
		h.updateRoute(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteRoute"):
		h.deleteRoute(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetIntegrations"):
		h.getIntegrationsV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateIntegration"): // HTTP API v2 - must be after CreateRoute
		h.createIntegrationV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateIntegration"):
		h.updateIntegrationV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteIntegration"): // HTTP API v2
		h.deleteIntegrationV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetStages"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.getStagesV2(ctx, c, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.getStages(ctx, c, bodyBytes)
		} else {
			h.getStagesV2(ctx, c, bodyBytes)
		}
	case strings.Contains(xAmzTarget, "GetStage"):
		h.getStageV2(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateStage"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.createStageV2(ctx, c, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.createStage(ctx, c, bodyBytes)
		} else {
			h.createStageV2(ctx, c, bodyBytes)
		}
	case strings.Contains(xAmzTarget, "UpdateStage"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.updateStageV2(ctx, c, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.updateStage(ctx, c, bodyBytes)
		} else {
			h.updateStageV2(ctx, c, bodyBytes)
		}
	case strings.Contains(xAmzTarget, "DeleteStage"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.deleteStageV2(ctx, c, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.deleteStage(ctx, c, bodyBytes)
		} else {
			h.deleteStageV2(ctx, c, bodyBytes)
		}

	// REST API v1 operations
	case strings.Contains(xAmzTarget, "GetRestApis"):
		h.getRestApis(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateRestApi"):
		h.createRestApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteRestApi"):
		h.deleteRestApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetRestApi"):
		h.getRestApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateRestApi"):
		h.updateRestApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetResources"):
		h.getResources(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetResource"):
		h.getResource(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateResource"):
		h.createResource(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteResource"):
		h.deleteResource(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutMethod"):
		h.putMethod(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetMethod"):
		h.getMethod(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteMethod"):
		h.deleteMethod(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutIntegration"):
		h.putIntegration(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetIntegration"): // REST API v1 handler
		h.getIntegration(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteIntegration") && strings.HasPrefix(xAmzTarget, "APIGateway."): // REST API v1
		h.deleteIntegration(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateDeployment"):
		h.createDeployment(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteDeployment"):
		h.deleteDeployment(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetDeployments"):
		h.getDeployments(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateStage"):
		h.createStage(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetStages"):
		h.getStages(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateStage"):
		h.updateStage(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteStage"):
		h.deleteStage(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "ImportRestApi"):
		h.importRestApi(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetInvokeUrl"):
		if strings.HasPrefix(xAmzTarget, "ApiGatewayV2.") {
			h.getInvokeUrlV2(ctx, c, bodyBytes)
		} else if strings.HasPrefix(xAmzTarget, "APIGateway.") {
			h.getInvokeUrl(ctx, c, bodyBytes)
		} else {
			h.getInvokeUrlV2(ctx, c, bodyBytes)
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown API Gateway action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) getRestApis(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	log.Printf("getRestApis called with body: %s", string(bodyBytes))
	input := &apigateway.GetRestApisInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		log.Printf("getRestApis parse error: %v", err)
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetRestApis(ctx, input)
	if err != nil {
		log.Printf("getRestApis error: %v", err)
		sendError(c, http.StatusInternalServerError, "Failed to get REST APIs", err)
		return
	}
	log.Printf("getRestApis result type: %T", result)
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createRestApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.CreateRestApiInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateRestApi(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create REST API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) importRestApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
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
				sendError(c, http.StatusInternalServerError, "Failed to import REST API", err)
				return
			}
			c.JSON(http.StatusOK, result)
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
			sendError(c, http.StatusInternalServerError, "Failed to import REST API", err)
			return
		}
		c.JSON(http.StatusOK, result)
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
		sendError(c, http.StatusInternalServerError, "Failed to import REST API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteRestApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.DeleteRestApiInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteRestApi(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete REST API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRestApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	log.Printf("GetRestApi body: %s", string(bodyBytes))

	input := &apigateway.GetRestApiInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	log.Printf("GetRestApi input: RestApiId=%s", aws.ToString(input.RestApiId))

	result, err := h.Svc.APIGateway().GetRestApi(ctx, input)
	if err != nil {
		log.Printf("GetRestApi error: %v", err)
		sendError(c, http.StatusInternalServerError, "Failed to get REST API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateRestApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	log.Printf("UpdateRestApi body: %s", string(bodyBytes))

	var bodyData map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		log.Printf("UpdateRestApi: json unmarshal error: %v", err)
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
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
			sendError(c, http.StatusInternalServerError, "Failed to update REST API", err)
			return
		}
		c.JSON(http.StatusOK, result)
		return
	}

	// AWS SDK format with patchOperations array
	log.Printf("UpdateRestApi: using AWS SDK patchOperations format")
	input := &apigateway.UpdateRestApiInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().UpdateRestApi(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update REST API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getResources(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.GetResourcesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetResources(ctx, input)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "NotFoundException") || strings.Contains(errStr, "not found") || strings.Contains(errStr, "Invalid API") {
			c.JSON(http.StatusOK, gin.H{"items": []interface{}{}, "item": []interface{}{}})
			return
		}
		sendError(c, http.StatusInternalServerError, "Failed to get resources", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getResource(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.GetResourceInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetResource(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get resource", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createResource(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	log.Printf("createResource body: %s", string(bodyBytes))

	input := &apigateway.CreateResourceInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		log.Printf("createResource parse error: %v", err)
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	log.Printf("createResource input: RestApiId=%s, ParentId=%s, PathPart=%s",
		aws.ToString(input.RestApiId), aws.ToString(input.ParentId), aws.ToString(input.PathPart))

	result, err := h.Svc.APIGateway().CreateResource(ctx, input)
	if err != nil {
		log.Printf("createResource error: %v", err)
		sendError(c, http.StatusInternalServerError, "Failed to create resource", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteResource(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.DeleteResourceInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteResource(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete resource", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putMethod(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.PutMethodInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().PutMethod(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put method", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getMethod(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.GetMethodInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetMethod(ctx, input)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "NotFound") || strings.Contains(errStr, "not found") {
			c.JSON(http.StatusNotFound, map[string]string{"message": "Method not found"})
			return
		}
		log.Printf("GetMethod error: %v", err)
		sendError(c, http.StatusInternalServerError, "Failed to get method", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteMethod(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.DeleteMethodInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteMethod(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete method", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putIntegration(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.PutIntegrationInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	log.Printf("PutIntegration input: %+v", input)
	result, err := h.Svc.APIGateway().PutIntegration(ctx, input)
	if err != nil {
		log.Printf("PutIntegration error: %v", err)
		sendError(c, http.StatusInternalServerError, "Failed to put integration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getIntegration(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.GetIntegrationInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetIntegration(ctx, input)
	if err != nil {
		errStr := err.Error()
		if strings.Contains(errStr, "NotFound") || strings.Contains(errStr, "not found") || strings.Contains(errStr, "Invalid integration") {
			c.JSON(http.StatusNotFound, map[string]string{"message": "Integration not found"})
			return
		}
		log.Printf("GetIntegration error: %v", err)
		sendError(c, http.StatusInternalServerError, "Failed to get integration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteIntegration(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.DeleteIntegrationInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().DeleteIntegration(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete integration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createDeployment(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.CreateDeploymentInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateDeployment(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create deployment", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteDeployment(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.DeleteDeploymentInput{}

	var data map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
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
		sendError(c, http.StatusInternalServerError, "Failed to delete deployment", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getDeployments(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.GetDeploymentsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetDeployments(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get deployments", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createStage(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.CreateStageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().CreateStage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getStages(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.GetStagesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().GetStages(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get stages", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateStage(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.UpdateStageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGateway().UpdateStage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteStage(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigateway.DeleteStageInput{}
	log.Printf("deleteStage raw body: %s", string(bodyBytes))

	// Parse to map first
	var data map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
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
		sendError(c, http.StatusInternalServerError, "Failed to delete stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// HTTP API v2 (ApiGatewayV2) handlers
func (h *ProxyHandler) getApis(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.GetApisInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetApis(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get HTTP APIs", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &apigatewayv2.CreateApiInput{
		ProtocolType: apigwV2Types.ProtocolTypeHttp,
	}

	// Handle both lowercase and TitleCase keys
	if v, ok := data["name"]; ok && v != nil {
		input.Name = aws.String(v.(string))
	} else if v, ok := data["Name"]; ok && v != nil {
		input.Name = aws.String(v.(string))
	}
	if v, ok := data["description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	} else if v, ok := data["Description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	}

	result, err := h.Svc.APIGatewayV2().CreateApi(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create HTTP API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.DeleteApiInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteApi(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete HTTP API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getApi(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.GetApiInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetApi(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get HTTP API", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getRoutes(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.GetRoutesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetRoutes(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get routes", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createRoute(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Support both lowercase and TitleCase keys from frontend
	apiId, apiIdOk := data["apiId"]
	if !apiIdOk || apiId == nil || apiId == "" {
		apiId, apiIdOk = data["ApiId"]
	}
	if !apiIdOk || apiId == nil || apiId == "" {
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}

	input := &apigatewayv2.CreateRouteInput{
		ApiId: aws.String(apiId.(string)),
	}

	if v, ok := data["routeKey"]; ok && v != nil {
		input.RouteKey = aws.String(v.(string))
	} else if v, ok := data["RouteKey"]; ok && v != nil {
		input.RouteKey = aws.String(v.(string))
	}
	if v, ok := data["target"]; ok && v != nil {
		input.Target = aws.String(v.(string))
	} else if v, ok := data["Target"]; ok && v != nil {
		input.Target = aws.String(v.(string))
	}
	if v, ok := data["authorizationType"]; ok && v != nil {
		input.AuthorizationType = apigwV2Types.AuthorizationType(v.(string))
	} else if v, ok := data["AuthorizationType"]; ok && v != nil {
		input.AuthorizationType = apigwV2Types.AuthorizationType(v.(string))
	}
	if v, ok := data["authorizerId"]; ok && v != nil {
		input.AuthorizerId = aws.String(v.(string))
	} else if v, ok := data["AuthorizerId"]; ok && v != nil {
		input.AuthorizerId = aws.String(v.(string))
	}

	result, err := h.Svc.APIGatewayV2().CreateRoute(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create route", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteRoute(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.DeleteRouteInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteRoute(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete route", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateRoute(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Support both lowercase and TitleCase keys from frontend
	apiId, apiIdOk := data["apiId"]
	if !apiIdOk || apiId == nil || apiId == "" {
		apiId, apiIdOk = data["ApiId"]
	}
	routeId, routeIdOk := data["routeId"]
	if !routeIdOk || routeId == nil || routeId == "" {
		routeId, routeIdOk = data["RouteId"]
	}
	if !apiIdOk || apiId == nil || apiId == "" {
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if !routeIdOk || routeId == nil || routeId == "" {
		sendError(c, http.StatusBadRequest, "RouteId is required", nil)
		return
	}

	input := &apigatewayv2.UpdateRouteInput{
		ApiId:   aws.String(apiId.(string)),
		RouteId: aws.String(routeId.(string)),
	}

	if v, ok := data["routeKey"]; ok && v != nil {
		input.RouteKey = aws.String(v.(string))
	} else if v, ok := data["RouteKey"]; ok && v != nil {
		input.RouteKey = aws.String(v.(string))
	}
	if v, ok := data["authorizationType"]; ok && v != nil {
		input.AuthorizationType = apigwV2Types.AuthorizationType(v.(string))
	} else if v, ok := data["AuthorizationType"]; ok && v != nil {
		input.AuthorizationType = apigwV2Types.AuthorizationType(v.(string))
	}
	if v, ok := data["authorizerId"]; ok && v != nil {
		input.AuthorizerId = aws.String(v.(string))
	} else if v, ok := data["AuthorizerId"]; ok && v != nil {
		input.AuthorizerId = aws.String(v.(string))
	}

	result, err := h.Svc.APIGatewayV2().UpdateRoute(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update route", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getIntegrationsV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.GetIntegrationsInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetIntegrations(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get integrations", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createIntegrationV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Support both lowercase and TitleCase keys from frontend
	apiId, apiIdOk := data["apiId"]
	if !apiIdOk || apiId == nil || apiId == "" {
		apiId, apiIdOk = data["ApiId"]
	}
	if !apiIdOk || apiId == nil || apiId == "" {
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}

	input := &apigatewayv2.CreateIntegrationInput{
		ApiId: aws.String(apiId.(string)),
	}

	// Map both lowercase and TitleCase keys
	if v, ok := data["integrationType"]; ok && v != nil {
		input.IntegrationType = apigwV2Types.IntegrationType(v.(string))
	} else if v, ok := data["IntegrationType"]; ok && v != nil {
		input.IntegrationType = apigwV2Types.IntegrationType(v.(string))
	}
	if v, ok := data["integrationUri"]; ok && v != nil {
		input.IntegrationUri = aws.String(v.(string))
	} else if v, ok := data["IntegrationUri"]; ok && v != nil {
		input.IntegrationUri = aws.String(v.(string))
	}
	if v, ok := data["connectionType"]; ok && v != nil {
		input.ConnectionType = apigwV2Types.ConnectionType(v.(string))
	} else if v, ok := data["ConnectionType"]; ok && v != nil {
		input.ConnectionType = apigwV2Types.ConnectionType(v.(string))
	}
	if v, ok := data["credentialsArn"]; ok && v != nil {
		input.CredentialsArn = aws.String(v.(string))
	} else if v, ok := data["CredentialsArn"]; ok && v != nil {
		input.CredentialsArn = aws.String(v.(string))
	}
	if v, ok := data["description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	} else if v, ok := data["Description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	}
	if v, ok := data["timeoutInMillis"]; ok && v != nil {
		if fv, ok := v.(float64); ok {
			input.TimeoutInMillis = aws.Int32(int32(fv))
		}
	} else if v, ok := data["TimeoutInMillis"]; ok && v != nil {
		if fv, ok := v.(float64); ok {
			input.TimeoutInMillis = aws.Int32(int32(fv))
		}
	}
	if v, ok := data["integrationMethod"]; ok && v != nil {
		input.IntegrationMethod = aws.String(v.(string))
	} else if v, ok := data["IntegrationMethod"]; ok && v != nil {
		input.IntegrationMethod = aws.String(v.(string))
	}
	if v, ok := data["payloadFormatVersion"]; ok && v != nil {
		input.PayloadFormatVersion = aws.String(v.(string))
	} else if v, ok := data["PayloadFormatVersion"]; ok && v != nil {
		input.PayloadFormatVersion = aws.String(v.(string))
	}

	result, err := h.Svc.APIGatewayV2().CreateIntegration(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create integration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateIntegrationV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Support both lowercase and TitleCase keys from frontend
	apiId, apiIdOk := data["apiId"]
	if !apiIdOk || apiId == nil || apiId == "" {
		apiId, apiIdOk = data["ApiId"]
	}
	integrationId, integrationIdOk := data["integrationId"]
	if !integrationIdOk || integrationId == nil || integrationId == "" {
		integrationId, integrationIdOk = data["IntegrationId"]
	}
	if !apiIdOk || apiId == nil || apiId == "" {
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if !integrationIdOk || integrationId == nil || integrationId == "" {
		sendError(c, http.StatusBadRequest, "IntegrationId is required", nil)
		return
	}

	input := &apigatewayv2.UpdateIntegrationInput{
		ApiId:         aws.String(apiId.(string)),
		IntegrationId: aws.String(integrationId.(string)),
	}

	if v, ok := data["integrationType"]; ok && v != nil {
		input.IntegrationType = apigwV2Types.IntegrationType(v.(string))
	} else if v, ok := data["IntegrationType"]; ok && v != nil {
		input.IntegrationType = apigwV2Types.IntegrationType(v.(string))
	}
	if v, ok := data["integrationUri"]; ok && v != nil {
		input.IntegrationUri = aws.String(v.(string))
	} else if v, ok := data["IntegrationUri"]; ok && v != nil {
		input.IntegrationUri = aws.String(v.(string))
	}
	if v, ok := data["description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	} else if v, ok := data["Description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	}

	result, err := h.Svc.APIGatewayV2().UpdateIntegration(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update integration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteIntegrationV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.DeleteIntegrationInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteIntegration(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete integration", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// HTTP API v2 Stage handlers
func (h *ProxyHandler) getStagesV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.GetStagesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
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
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}

	result, err := h.Svc.APIGatewayV2().GetStages(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get stages", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getStageV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.GetStageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().GetStage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createStageV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Support both lowercase and TitleCase keys from frontend
	apiId, apiIdOk := data["apiId"]
	if !apiIdOk || apiId == nil || apiId == "" {
		apiId, apiIdOk = data["ApiId"]
	}
	if !apiIdOk || apiId == nil || apiId == "" {
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}

	input := &apigatewayv2.CreateStageInput{
		ApiId: aws.String(apiId.(string)),
	}

	if v, ok := data["stageName"]; ok && v != nil {
		input.StageName = aws.String(v.(string))
	} else if v, ok := data["StageName"]; ok && v != nil {
		input.StageName = aws.String(v.(string))
	}
	if v, ok := data["description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	} else if v, ok := data["Description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	}
	if v, ok := data["autoDeploy"]; ok && v != nil {
		if bv, ok := v.(bool); ok {
			input.AutoDeploy = aws.Bool(bv)
		}
	} else if v, ok := data["AutoDeploy"]; ok && v != nil {
		if bv, ok := v.(bool); ok {
			input.AutoDeploy = aws.Bool(bv)
		}
	}

	result, err := h.Svc.APIGatewayV2().CreateStage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateStageV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	data := make(map[string]interface{})
	if err := json.Unmarshal(bodyBytes, &data); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	// Support both lowercase and TitleCase keys from frontend
	apiId, apiIdOk := data["apiId"]
	if !apiIdOk || apiId == nil || apiId == "" {
		apiId, apiIdOk = data["ApiId"]
	}
	stageName, stageNameOk := data["stageName"]
	if !stageNameOk || stageName == nil || stageName == "" {
		stageName, stageNameOk = data["StageName"]
	}
	if !apiIdOk || apiId == nil || apiId == "" {
		sendError(c, http.StatusBadRequest, "ApiId is required", nil)
		return
	}
	if !stageNameOk || stageName == nil || stageName == "" {
		sendError(c, http.StatusBadRequest, "StageName is required", nil)
		return
	}

	input := &apigatewayv2.UpdateStageInput{
		ApiId:     aws.String(apiId.(string)),
		StageName: aws.String(stageName.(string)),
	}

	if v, ok := data["description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	} else if v, ok := data["Description"]; ok && v != nil {
		input.Description = aws.String(v.(string))
	}
	if v, ok := data["autoDeploy"]; ok && v != nil {
		if bv, ok := v.(bool); ok {
			input.AutoDeploy = aws.Bool(bv)
		}
	} else if v, ok := data["AutoDeploy"]; ok && v != nil {
		if bv, ok := v.(bool); ok {
			input.AutoDeploy = aws.Bool(bv)
		}
	}

	result, err := h.Svc.APIGatewayV2().UpdateStage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteStageV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &apigatewayv2.DeleteStageInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.APIGatewayV2().DeleteStage(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete stage", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) getInvokeUrl(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	var bodyData struct {
		ApiID     string `json:"apiId"`
		StageName string `json:"stageName"`
	}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	url, err := h.Svc.APIGateway().GetInvokeUrl(ctx, bodyData.ApiID, bodyData.StageName)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get invoke URL", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"invokeUrl": url})
}

func (h *ProxyHandler) getInvokeUrlV2(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	var bodyData struct {
		ApiID     string `json:"apiId"`
		StageName string `json:"stageName"`
	}
	if err := json.Unmarshal(bodyBytes, &bodyData); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	url, err := h.Svc.APIGatewayV2().GetInvokeUrl(ctx, bodyData.ApiID, bodyData.StageName)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get invoke URL", err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"invokeUrl": url})
}
