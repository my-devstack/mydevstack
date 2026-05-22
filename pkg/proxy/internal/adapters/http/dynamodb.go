package httphandlers

import (
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
	"github.com/go-chi/chi/v5"
)

func (h *ProxyHandler) registerDynamoDBRoutes(r chi.Router) {
	r.Route("/dynamodb", func(r chi.Router) {
		r.Post("/tables", h.createTable)
		r.Get("/tables", h.listTables)
		r.Get("/tables/{tableName}", h.describeTable)
		r.Put("/tables/{tableName}", h.updateTable)
		r.Delete("/tables/{tableName}", h.deleteTable)

		r.Post("/tables/{tableName}/items", h.putItem)
		r.Get("/tables/{tableName}/items/{key}", h.getItem)
		r.Delete("/tables/{tableName}/items/{key}", h.deleteItem)
		r.Put("/tables/{tableName}/items/{key}", h.updateItem)
		r.Post("/tables/{tableName}/query", h.query)
		r.Post("/tables/{tableName}/scan", h.scan)

		r.Post("/batch-write-item", h.batchWriteItem)
		r.Post("/batch-get-item", h.batchGetItem)

		r.Get("/tables/{tableName}/ttl", h.describeTimeToLive)
		r.Put("/tables/{tableName}/ttl", h.updateTimeToLive)
	})
}

func (h *ProxyHandler) listTables(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodb.ListTablesInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDB().ListTables(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to list tables", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) createTable(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodb.CreateTableInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDB().CreateTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeTable(w http.ResponseWriter, r *http.Request) {
	input := &dynamodb.DescribeTableInput{
		TableName: aws.String(chi.URLParam(r, "tableName")),
	}
	result, err := h.Svc.DynamoDB().DescribeTable(h.ctx, input)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "InvalidParameterValue") && strings.Contains(errMsg, "TableName") {
			sendError(w, http.StatusBadRequest, "Invalid table name format", err)
		} else {
			sendError(w, http.StatusInternalServerError, "Failed to describe table", err)
		}
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteTable(w http.ResponseWriter, r *http.Request) {
	input := &dynamodb.DeleteTableInput{
		TableName: aws.String(chi.URLParam(r, "tableName")),
	}
	result, err := h.Svc.DynamoDB().DeleteTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateTable(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodb.UpdateTableInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.TableName = aws.String(chi.URLParam(r, "tableName"))
	result, err := h.Svc.DynamoDB().UpdateTable(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update table", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) putItem(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.PutItemInput{}

	// TableName from URL
	input.TableName = aws.String(chi.URLParam(r, "tableName"))

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

	result, err := h.Svc.DynamoDB().PutItem(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to put item", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
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

func (h *ProxyHandler) getItem(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.GetItemInput{}

	// TableName from URL
	input.TableName = aws.String(chi.URLParam(r, "tableName"))

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

	result, err := h.Svc.DynamoDB().GetItem(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to get item", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) deleteItem(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.DeleteItemInput{}

	// TableName from URL
	input.TableName = aws.String(chi.URLParam(r, "tableName"))

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

	result, err := h.Svc.DynamoDB().DeleteItem(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to delete item", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateItem(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	log.Printf("UpdateItem request body: %s", string(bodyBytes))

	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.UpdateItemInput{}

	// TableName from URL
	input.TableName = aws.String(chi.URLParam(r, "tableName"))

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

	result, err := h.Svc.DynamoDB().UpdateItem(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update item", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) query(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.QueryInput{}

	// TableName from URL
	input.TableName = aws.String(chi.URLParam(r, "tableName"))

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

	result, err := h.Svc.DynamoDB().Query(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to query", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) scan(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	// Parse the body into a generic map first
	var rawBody map[string]interface{}
	if err := json.Unmarshal(bodyBytes, &rawBody); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}

	input := &dynamodb.ScanInput{}

	// TableName from URL
	input.TableName = aws.String(chi.URLParam(r, "tableName"))

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

	result, err := h.Svc.DynamoDB().Scan(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to scan", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
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

func (h *ProxyHandler) batchWriteItem(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodb.BatchWriteItemInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDB().BatchWriteItem(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to batch write", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) batchGetItem(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodb.BatchGetItemInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	result, err := h.Svc.DynamoDB().BatchGetItem(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to batch get", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) describeTimeToLive(w http.ResponseWriter, r *http.Request) {
	input := &dynamodb.DescribeTimeToLiveInput{
		TableName: aws.String(chi.URLParam(r, "tableName")),
	}
	result, err := h.Svc.DynamoDB().DescribeTimeToLive(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to describe TTL", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *ProxyHandler) updateTimeToLive(w http.ResponseWriter, r *http.Request) {
	bodyBytes := readBody(r)
	input := &dynamodb.UpdateTimeToLiveInput{}
	if err := parseBody(bodyBytes, input); err != nil {
		sendError(w, http.StatusBadRequest, "Invalid request body", err)
		return
	}
	input.TableName = aws.String(chi.URLParam(r, "tableName"))
	result, err := h.Svc.DynamoDB().UpdateTimeToLive(h.ctx, input)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to update TTL", err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}
