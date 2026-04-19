package httphandlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/gin-gonic/gin"
)

func (h *ProxyHandler) handleDynamoDB(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	ctx := context.Background()

	switch {
	case strings.Contains(xAmzTarget, "ListTables"):
		h.listTables(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "CreateTable"):
		h.createTable(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeTable"):
		h.describeTable(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteTable"):
		h.deleteTable(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateTable"):
		h.updateTable(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "PutItem"):
		h.putItem(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "GetItem"):
		h.getItem(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DeleteItem"):
		h.deleteItem(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateItem"):
		h.updateItem(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Query"):
		h.query(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "Scan"):
		h.scan(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "BatchWriteItem"):
		h.batchWriteItem(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "BatchGetItem"):
		h.batchGetItem(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "DescribeTimeToLive"):
		h.describeTimeToLive(ctx, c, bodyBytes)
	case strings.Contains(xAmzTarget, "UpdateTimeToLive"):
		h.updateTimeToLive(ctx, c, bodyBytes)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unknown DynamoDB action: " + xAmzTarget})
	}
}

func (h *ProxyHandler) listTables(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.ListTablesInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().ListTables(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to list tables", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) createTable(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.CreateTableInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().CreateTable(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to create table", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeTable(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.DescribeTableInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().DescribeTable(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe table", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteTable(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.DeleteTableInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().DeleteTable(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete table", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateTable(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.UpdateTableInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().UpdateTable(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update table", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) putItem(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.PutItemInput{}

	// Extract TableName
	if tableName, ok := rawBody["TableName"].(string); ok {
		input.TableName = aws.String(tableName)
	}

	// Extract and unmarshal Item
	if itemData, ok := rawBody["Item"].(map[string]interface{}); ok {
		item := make(map[string]types.AttributeValue)
		for key, value := range itemData {
			attrValue := convertToAttributeValue(value)
			if attrValue != nil {
				item[key] = attrValue
			}
		}
		input.Item = item
	}

	// Extract other optional fields
	if val, ok := rawBody["ConditionExpression"].(string); ok {
		input.ConditionExpression = aws.String(val)
	}
	if val, ok := rawBody["ReturnValues"].(string); ok {
		input.ReturnValues = types.ReturnValue(val)
	}

	result, err := h.svc.DynamoDB().PutItem(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to put item", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// convertToAttributeValue converts a JSON value to a DynamoDB AttributeValue
// Handles multiple formats: {"S": "value"} or {"M": {"Value": {...}}}
func convertToAttributeValue(value interface{}) types.AttributeValue {
	if value == nil {
		return &types.AttributeValueMemberNULL{Value: true}
	}

	switch v := value.(type) {
	case string:
		return &types.AttributeValueMemberS{Value: v}
	case float64:
		return &types.AttributeValueMemberN{Value: strconv.FormatFloat(v, 'f', -1, 64)}
	case bool:
		return &types.AttributeValueMemberBOOL{Value: v}
	case map[string]interface{}:
		// Check for wrapper format {"M": {"Value": {...}}}
		if m, ok := v["M"].(map[string]interface{}); ok {
			if innerValue, ok := m["Value"]; ok {
				return convertToAttributeValue(innerValue)
			}
		}

		// Check for DynamoDB attribute format like {"S": "value"}
		if s, ok := v["S"].(string); ok {
			return &types.AttributeValueMemberS{Value: s}
		}
		if n, ok := v["N"].(string); ok {
			return &types.AttributeValueMemberN{Value: n}
		}
		if b, ok := v["B"].(string); ok {
			decoded, _ := base64.StdEncoding.DecodeString(b)
			return &types.AttributeValueMemberB{Value: decoded}
		}
		if _, ok := v["BOOL"].(bool); ok {
			return &types.AttributeValueMemberBOOL{Value: v["BOOL"].(bool)}
		}
		if _, ok := v["NULL"].(bool); ok {
			return &types.AttributeValueMemberNULL{Value: true}
		}
		if l, ok := v["L"].([]interface{}); ok {
			list := make([]types.AttributeValue, len(l))
			for i, elem := range l {
				list[i] = convertToAttributeValue(elem)
			}
			return &types.AttributeValueMemberL{Value: list}
		}
		if m, ok := v["M"].(map[string]interface{}); ok {
			memberMap := make(map[string]types.AttributeValue)
			for mk, mv := range m {
				memberMap[mk] = convertToAttributeValue(mv)
			}
			return &types.AttributeValueMemberM{Value: memberMap}
		}
		if ss, ok := v["SS"].([]interface{}); ok {
			strSet := make([]string, len(ss))
			for i, s := range ss {
				if str, ok := s.(string); ok {
					strSet[i] = str
				}
			}
			return &types.AttributeValueMemberSS{Value: strSet}
		}
		if ns, ok := v["NS"].([]interface{}); ok {
			numSet := make([]string, len(ns))
			for i, n := range ns {
				if num, ok := n.(string); ok {
					numSet[i] = num
				}
			}
			return &types.AttributeValueMemberNS{Value: numSet}
		}
		// Fallback: treat as map
		memberMap := make(map[string]types.AttributeValue)
		for mk, mv := range v {
			memberMap[mk] = convertToAttributeValue(mv)
		}
		return &types.AttributeValueMemberM{Value: memberMap}
	case []interface{}:
		list := make([]types.AttributeValue, len(v))
		for i, elem := range v {
			list[i] = convertToAttributeValue(elem)
		}
		return &types.AttributeValueMemberL{Value: list}
	default:
		return &types.AttributeValueMemberS{Value: fmt.Sprintf("%v", v)}
	}
}

func (h *ProxyHandler) getItem(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.GetItemInput{}

	// Extract TableName
	if tableName, ok := rawBody["TableName"].(string); ok {
		input.TableName = aws.String(tableName)
	}

	// Extract and unmarshal Key
	if keyData, ok := rawBody["Key"].(map[string]interface{}); ok {
		key := make(map[string]types.AttributeValue)
		for k, value := range keyData {
			attrValue := convertToAttributeValue(value)
			if attrValue != nil {
				key[k] = attrValue
			}
		}
		input.Key = key
	}

	// Extract other optional fields
	if val, ok := rawBody["ConsistentRead"].(bool); ok {
		input.ConsistentRead = aws.Bool(val)
	}
	if val, ok := rawBody["ProjectionExpression"].(string); ok {
		input.ProjectionExpression = aws.String(val)
	}

	result, err := h.svc.DynamoDB().GetItem(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to get item", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) deleteItem(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.DeleteItemInput{}

	// Extract TableName
	if tableName, ok := rawBody["TableName"].(string); ok {
		input.TableName = aws.String(tableName)
	}

	// Extract and unmarshal Key
	if keyData, ok := rawBody["Key"].(map[string]interface{}); ok {
		key := make(map[string]types.AttributeValue)
		for k, value := range keyData {
			attrValue := convertToAttributeValue(value)
			if attrValue != nil {
				key[k] = attrValue
			}
		}
		input.Key = key
	}

	// Extract other optional fields
	if val, ok := rawBody["ConditionExpression"].(string); ok {
		input.ConditionExpression = aws.String(val)
	}
	if val, ok := rawBody["ReturnValues"].(string); ok {
		input.ReturnValues = types.ReturnValue(val)
	}

	result, err := h.svc.DynamoDB().DeleteItem(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to delete item", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateItem(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	log.Printf("UpdateItem request body: %s", string(bodyBytes))

	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.UpdateItemInput{}

	// Extract TableName
	if tableName, ok := rawBody["TableName"].(string); ok {
		input.TableName = aws.String(tableName)
	}

	// Extract and unmarshal Key
	if keyData, ok := rawBody["Key"].(map[string]interface{}); ok {
		key := make(map[string]types.AttributeValue)
		for k, value := range keyData {
			attrValue := convertToAttributeValue(value)
			if attrValue != nil {
				key[k] = attrValue
			}
		}
		input.Key = key
	}

	// Extract optional fields
	if val, ok := rawBody["UpdateExpression"].(string); ok {
		input.UpdateExpression = aws.String(val)
	}
	if val, ok := rawBody["ConditionExpression"].(string); ok {
		input.ConditionExpression = aws.String(val)
	}
	if val, ok := rawBody["ReturnValues"].(string); ok {
		input.ReturnValues = types.ReturnValue(val)
	}

	result, err := h.svc.DynamoDB().UpdateItem(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update item", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) query(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.QueryInput{}

	// Extract TableName
	if tableName, ok := rawBody["TableName"].(string); ok {
		input.TableName = aws.String(tableName)
	}

	// Extract optional fields
	if val, ok := rawBody["KeyConditionExpression"].(string); ok {
		input.KeyConditionExpression = aws.String(val)
	}
	if val, ok := rawBody["FilterExpression"].(string); ok {
		input.FilterExpression = aws.String(val)
	}
	if val, ok := rawBody["ProjectionExpression"].(string); ok {
		input.ProjectionExpression = aws.String(val)
	}
	if val, ok := rawBody["Limit"].(float64); ok {
		input.Limit = aws.Int32(int32(val))
	}
	if val, ok := rawBody["ScanIndexForward"].(bool); ok {
		input.ScanIndexForward = aws.Bool(val)
	}
	if val, ok := rawBody["ExclusiveStartKey"].(map[string]interface{}); ok {
		input.ExclusiveStartKey = convertMapToAttributeValue(val)
	}

	result, err := h.svc.DynamoDB().Query(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to query", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) scan(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.ScanInput{}

	// Extract TableName
	if tableName, ok := rawBody["TableName"].(string); ok {
		input.TableName = aws.String(tableName)
	}

	// Extract optional fields
	if val, ok := rawBody["Limit"].(float64); ok {
		input.Limit = aws.Int32(int32(val))
	}
	if val, ok := rawBody["FilterExpression"].(string); ok {
		input.FilterExpression = aws.String(val)
	}
	if val, ok := rawBody["ProjectionExpression"].(string); ok {
		input.ProjectionExpression = aws.String(val)
	}
	if val, ok := rawBody["ExclusiveStartKey"].(map[string]interface{}); ok {
		input.ExclusiveStartKey = convertMapToAttributeValue(val)
	}

	result, err := h.svc.DynamoDB().Scan(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to scan", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// convertMapToAttributeValue converts a map to DynamoDB AttributeValue map
func convertMapToAttributeValue(data map[string]interface{}) map[string]types.AttributeValue {
	if data == nil {
		return nil
	}
	result := make(map[string]types.AttributeValue)
	for k, v := range data {
		result[k] = convertToAttributeValue(v)
	}
	return result
}

func (h *ProxyHandler) batchWriteItem(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.BatchWriteItemInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().BatchWriteItem(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to batch write", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) batchGetItem(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.BatchGetItemInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().BatchGetItem(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to batch get", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) describeTimeToLive(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.DescribeTimeToLiveInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().DescribeTimeToLive(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to describe TTL", err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *ProxyHandler) updateTimeToLive(ctx context.Context, c *gin.Context, bodyBytes []byte) {
	input := &dynamodb.UpdateTimeToLiveInput{}
	if err := parseBody(c, bodyBytes, input); err != nil {
		sendError(c, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.svc.DynamoDB().UpdateTimeToLive(ctx, input)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to update TTL", err)
		return
	}
	c.JSON(http.StatusOK, result)
}
