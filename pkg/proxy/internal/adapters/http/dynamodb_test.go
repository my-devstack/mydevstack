package httphandlers

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"


	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
)

// ---------------------------------------------------------------------------
// TestHandleDynamoDB – ListTables / CreateTable / DescribeTable / DeleteTable / UpdateTable
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_ListTables(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().ListTables(mock.Anything, mock.Anything).Return(&dynamodb.ListTablesOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "ListTables", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().ListTables(mock.Anything, mock.Anything).Return(nil, errors.New("internal error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "ListTables", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestHandleDynamoDB_CreateTable(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().CreateTable(mock.Anything, mock.Anything).Return(&dynamodb.CreateTableOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "CreateTable", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().CreateTable(mock.Anything, mock.Anything).Return(nil, errors.New("create error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "CreateTable", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestHandleDynamoDB_DescribeTable(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DescribeTable(mock.Anything, mock.Anything).Return(&dynamodb.DescribeTableOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DescribeTable", []byte(`{"TableName":"test"}`))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error generic", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DescribeTable(mock.Anything, mock.Anything).Return(nil, errors.New("describe error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DescribeTable", []byte(`{"TableName":"test"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("error InvalidParameterValue TableName -> 400", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DescribeTable(mock.Anything, mock.Anything).
			Return(nil, errors.New("InvalidParameterValue: TableName"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DescribeTable", []byte(`{"TableName":"bad"}`))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestHandleDynamoDB_DeleteTable(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DeleteTable(mock.Anything, mock.Anything).Return(&dynamodb.DeleteTableOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DeleteTable", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DeleteTable(mock.Anything, mock.Anything).Return(nil, errors.New("delete error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DeleteTable", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestHandleDynamoDB_UpdateTable(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateTable(mock.Anything, mock.Anything).Return(&dynamodb.UpdateTableOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "UpdateTable", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateTable(mock.Anything, mock.Anything).Return(nil, errors.New("update error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "UpdateTable", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// PutItem / GetItem / DeleteItem / UpdateItem – custom JSON parsing
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_PutItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().PutItem(mock.Anything, mock.Anything).Return(&dynamodb.PutItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "PutItem", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().PutItem(mock.Anything, mock.Anything).Return(nil, errors.New("put error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "PutItem", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Item/ConditionExpression/ReturnValues", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().PutItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.PutItemInput) bool {
			return input.TableName != nil && *input.TableName == "my-table" &&
				input.ConditionExpression != nil && *input.ConditionExpression == "attribute_not_exists(pk)" &&
				input.ReturnValues == types.ReturnValue("ALL_OLD") &&
				len(input.Item) > 0
		})).Return(&dynamodb.PutItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"TableName":"my-table","Item":{"pk":{"S":"val1"},"sk":{"S":"val2"}},"ConditionExpression":"attribute_not_exists(pk)","ReturnValues":"ALL_OLD"}`
		w := performRequest(r, "POST", "/dynamodb", "PutItem", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestHandleDynamoDB_GetItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().GetItem(mock.Anything, mock.Anything).Return(&dynamodb.GetItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "GetItem", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().GetItem(mock.Anything, mock.Anything).Return(nil, errors.New("get error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "GetItem", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Key/ConsistentRead/ProjectionExpression", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().GetItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.GetItemInput) bool {
			return input.TableName != nil && *input.TableName == "my-table" &&
				input.ConsistentRead != nil && *input.ConsistentRead == true &&
				input.ProjectionExpression != nil && *input.ProjectionExpression == "pk, sk" &&
				len(input.Key) > 0
		})).Return(&dynamodb.GetItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"TableName":"my-table","Key":{"pk":{"S":"val1"}},"ConsistentRead":true,"ProjectionExpression":"pk, sk"}`
		w := performRequest(r, "POST", "/dynamodb", "GetItem", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestHandleDynamoDB_DeleteItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DeleteItem(mock.Anything, mock.Anything).Return(&dynamodb.DeleteItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DeleteItem", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DeleteItem(mock.Anything, mock.Anything).Return(nil, errors.New("delete item error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DeleteItem", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Key/ConditionExpression/ReturnValues", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DeleteItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.DeleteItemInput) bool {
			return input.TableName != nil && *input.TableName == "my-table" &&
				input.ConditionExpression != nil && *input.ConditionExpression == "attribute_exists(pk)" &&
				input.ReturnValues == types.ReturnValue("ALL_OLD") &&
				len(input.Key) > 0
		})).Return(&dynamodb.DeleteItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"TableName":"my-table","Key":{"pk":{"S":"val1"}},"ConditionExpression":"attribute_exists(pk)","ReturnValues":"ALL_OLD"}`
		w := performRequest(r, "POST", "/dynamodb", "DeleteItem", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestHandleDynamoDB_UpdateItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateItem(mock.Anything, mock.Anything).Return(&dynamodb.UpdateItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "UpdateItem", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateItem(mock.Anything, mock.Anything).Return(nil, errors.New("update item error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "UpdateItem", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Key/UpdateExpression/ConditionExpression/ReturnValues", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.UpdateItemInput) bool {
			return input.TableName != nil && *input.TableName == "my-table" &&
				input.UpdateExpression != nil && *input.UpdateExpression == "SET #a = :b" &&
				input.ConditionExpression != nil && *input.ConditionExpression == "attribute_exists(pk)" &&
				input.ReturnValues == types.ReturnValue("UPDATED_NEW") &&
				len(input.Key) > 0
		})).Return(&dynamodb.UpdateItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"TableName":"my-table","Key":{"pk":{"S":"val1"}},"UpdateExpression":"SET #a = :b","ConditionExpression":"attribute_exists(pk)","ReturnValues":"UPDATED_NEW"}`
		w := performRequest(r, "POST", "/dynamodb", "UpdateItem", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestHandleDynamoDB_Query(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Query(mock.Anything, mock.Anything).Return(&dynamodb.QueryOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "Query", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Query(mock.Anything, mock.Anything).Return(nil, errors.New("query error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "Query", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/KeyConditionExpression/FilterExpression/Limit/ScanIndexForward/ExclusiveStartKey", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Query(mock.Anything, mock.MatchedBy(func(input *dynamodb.QueryInput) bool {
			return input.TableName != nil && *input.TableName == "my-table" &&
				input.KeyConditionExpression != nil && *input.KeyConditionExpression == "pk = :pk" &&
				input.FilterExpression != nil && *input.FilterExpression == "sk > :sk" &&
				input.Limit != nil && *input.Limit == 10 &&
				input.ScanIndexForward != nil && *input.ScanIndexForward == false &&
				len(input.ExclusiveStartKey) > 0
		})).Return(&dynamodb.QueryOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"TableName":"my-table","KeyConditionExpression":"pk = :pk","FilterExpression":"sk > :sk","Limit":10,"ScanIndexForward":false,"ExclusiveStartKey":{"pk":{"S":"lastkey"}}}`
		w := performRequest(r, "POST", "/dynamodb", "Query", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestHandleDynamoDB_Scan(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Scan(mock.Anything, mock.Anything).Return(&dynamodb.ScanOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "Scan", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Scan(mock.Anything, mock.Anything).Return(nil, errors.New("scan error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "Scan", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Limit/FilterExpression/ProjectionExpression/ExclusiveStartKey", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Scan(mock.Anything, mock.MatchedBy(func(input *dynamodb.ScanInput) bool {
			return input.TableName != nil && *input.TableName == "my-table" &&
				input.Limit != nil && *input.Limit == 100 &&
				input.FilterExpression != nil && *input.FilterExpression == "pk > :pk" &&
				input.ProjectionExpression != nil && *input.ProjectionExpression == "pk, sk" &&
				len(input.ExclusiveStartKey) > 0
		})).Return(&dynamodb.ScanOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"TableName":"my-table","Limit":100,"FilterExpression":"pk > :pk","ProjectionExpression":"pk, sk","ExclusiveStartKey":{"pk":{"S":"lastkey"}}}`
		w := performRequest(r, "POST", "/dynamodb", "Scan", []byte(body))
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

// ---------------------------------------------------------------------------
// BatchWriteItem (no substring conflict – routes correctly)
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_BatchWriteItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().BatchWriteItem(mock.Anything, mock.Anything).Return(&dynamodb.BatchWriteItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "BatchWriteItem", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().BatchWriteItem(mock.Anything, mock.Anything).Return(nil, errors.New("batch write error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "BatchWriteItem", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// BatchGetItem – routes via string.Contains → matches "GetItem" first
//   (production routing quirk: "BatchGetItem" contains "GetItem")
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_BatchGetItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		// "BatchGetItem" contains "GetItem" → routes to getItem handler → calls GetItem
		mp.EXPECT().GetItem(mock.Anything, mock.Anything).Return(&dynamodb.GetItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "BatchGetItem", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().GetItem(mock.Anything, mock.Anything).Return(nil, errors.New("batch get error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "BatchGetItem", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// BatchGetItem — direct handler tests
//
// "BatchGetItem" contains "GetItem", so the router dispatches it to
// getItem handler. These tests call batchGetItem directly.
// ---------------------------------------------------------------------------

func TestDynamoDB_BatchGetItem_Direct(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().BatchGetItem(mock.Anything, mock.Anything).Return(&dynamodb.BatchGetItemOutput{}, nil)
		svc := createMockSvc(t, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		handler := createHandler(svc, createTestVersionService(t))

		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/dynamodb", bytes.NewReader([]byte("{}")))

		handler.batchGetItem(context.Background(), w, req, []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("service error", func(t *testing.T) {
		t.Parallel()
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().BatchGetItem(mock.Anything, mock.Anything).Return(nil, errors.New("batch get error"))
		svc := createMockSvc(t, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		handler := createHandler(svc, createTestVersionService(t))

		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/dynamodb", bytes.NewReader([]byte("{}")))

		handler.batchGetItem(context.Background(), w, req, []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/dynamodb", bytes.NewReader([]byte("{bad")))

		handler.batchGetItem(context.Background(), w, req, []byte("{bad"))
		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// ---------------------------------------------------------------------------
// DescribeTimeToLive / UpdateTimeToLive
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_DescribeTimeToLive(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DescribeTimeToLive(mock.Anything, mock.Anything).Return(&dynamodb.DescribeTimeToLiveOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DescribeTimeToLive", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DescribeTimeToLive(mock.Anything, mock.Anything).Return(nil, errors.New("describe TTL error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "DescribeTimeToLive", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

func TestHandleDynamoDB_UpdateTimeToLive(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateTimeToLive(mock.Anything, mock.Anything).Return(&dynamodb.UpdateTimeToLiveOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "UpdateTimeToLive", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateTimeToLive(mock.Anything, mock.Anything).Return(nil, errors.New("update TTL error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb", "UpdateTimeToLive", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// Invalid body type (valid JSON but not a map) for custom-parsing handlers
// These handlers use json.Unmarshal into map[string]interface{}.
// A JSON string or array fails the unmarshal → 400 error.
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_CustomParse_InvalidBodyType(t *testing.T) {
	t.Parallel()

	type bodyCase struct {
		name   string
		target string
		body   string
	}

	cases := []bodyCase{
		{name: "PutItem string", target: "PutItem", body: `"not a map"`},
		{name: "GetItem string", target: "GetItem", body: `"not a map"`},
		{name: "DeleteItem string", target: "DeleteItem", body: `"not a map"`},
		{name: "UpdateItem string", target: "UpdateItem", body: `"not a map"`},
		{name: "Query string", target: "Query", body: `"not a map"`},
		{name: "Scan string", target: "Scan", body: `"not a map"`},
		{name: "PutItem array", target: "PutItem", body: `[1,2,3]`},
		{name: "GetItem array", target: "GetItem", body: `[1,2,3]`},
		{name: "DeleteItem array", target: "DeleteItem", body: `[1,2,3]`},
		{name: "UpdateItem array", target: "UpdateItem", body: `[1,2,3]`},
		{name: "Query array", target: "Query", body: `[1,2,3]`},
		{name: "Scan array", target: "Scan", body: `[1,2,3]`},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			versionSvc := createTestVersionService(t)
			handler := NewProxyHandler(context.Background(), svc, versionSvc)
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/dynamodb", tc.target, []byte(tc.body))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", tc.target, tc.body)
		})
	}
}

// ---------------------------------------------------------------------------
// Parse error tests – handlers return before calling DynamoDB()
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_ParseErrors(t *testing.T) {
	t.Parallel()

	type parseCase struct {
		name   string
		target string
	}

	cases := []parseCase{
		{name: "ListTables", target: "ListTables"},
		{name: "CreateTable", target: "CreateTable"},
		{name: "DescribeTable", target: "DescribeTable"},
		{name: "DeleteTable", target: "DeleteTable"},
		{name: "UpdateTable", target: "UpdateTable"},
		{name: "PutItem", target: "PutItem"},
		{name: "GetItem", target: "GetItem"},
		{name: "DeleteItem", target: "DeleteItem"},
		{name: "UpdateItem", target: "UpdateItem"},
		{name: "Query", target: "Query"},
		{name: "Scan", target: "Scan"},
		{name: "BatchWriteItem", target: "BatchWriteItem"},
		{name: "BatchGetItem", target: "BatchGetItem"},
		{name: "DescribeTimeToLive", target: "DescribeTimeToLive"},
		{name: "UpdateTimeToLive", target: "UpdateTimeToLive"},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			// No DynamoDB() expectation – handler returns before calling it.
			versionSvc := createTestVersionService(t)
			handler := NewProxyHandler(context.Background(), svc, versionSvc)
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/dynamodb", tc.target, []byte("{bad json}"))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s", tc.target)
		})
	}
}

// ---------------------------------------------------------------------------
// Unknown DynamoDB action → 400
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_UnknownAction(t *testing.T) {
	t.Parallel()
	svc := createMockSvc(t, nil)
	versionSvc := createTestVersionService(t)
	handler := NewProxyHandler(context.Background(), svc, versionSvc)
	r := setupTestRouter(handler)
	w := performRequest(r, "POST", "/dynamodb", "UnknownAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)

	var resp map[string]interface{}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp["error"], "Unknown DynamoDB action")
}

// ---------------------------------------------------------------------------
// Test convertToAttributeValue
// ---------------------------------------------------------------------------

func TestConvertToAttributeValue(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input interface{}
		want  string // expected type name: S, N, B, BOOL, NULL, L, M, SS, NS
	}{
		{name: "nil", input: nil, want: "NULL"},
		{name: "string", input: "hello", want: "S"},
		{name: "float64", input: float64(42.5), want: "N"},
		{name: "bool true", input: true, want: "BOOL"},
		{name: "bool false", input: false, want: "BOOL"},
		{name: "map with S key", input: map[string]interface{}{"S": "val"}, want: "S"},
		{name: "map with N key", input: map[string]interface{}{"N": "123"}, want: "N"},
		{name: "map with B key", input: map[string]interface{}{"B": base64.StdEncoding.EncodeToString([]byte("data"))}, want: "B"},
		{name: "map with BOOL key true", input: map[string]interface{}{"BOOL": true}, want: "BOOL"},
		{name: "map with BOOL key false", input: map[string]interface{}{"BOOL": false}, want: "BOOL"},
		{name: "map with NULL key true", input: map[string]interface{}{"NULL": true}, want: "NULL"},
		{name: "map with NULL key false", input: map[string]interface{}{"NULL": false}, want: "NULL"},
		{name: "map with L key", input: map[string]interface{}{"L": []interface{}{map[string]interface{}{"S": "a"}}}, want: "L"},
		{name: "map with M key nested", input: map[string]interface{}{"M": map[string]interface{}{"pk": map[string]interface{}{"S": "v"}}}, want: "M"},
		{name: "map with SS key", input: map[string]interface{}{"SS": []interface{}{"a", "b"}}, want: "SS"},
		{name: "map with NS key", input: map[string]interface{}{"NS": []interface{}{"1", "2"}}, want: "NS"},
		{name: "map M wrapper format", input: map[string]interface{}{"M": map[string]interface{}{"Value": map[string]interface{}{"S": "nested"}}}, want: "S"},
		{name: "[]interface{}", input: []interface{}{map[string]interface{}{"S": "a"}}, want: "L"},
		{name: "map fallback to M", input: map[string]interface{}{"unknown": "val"}, want: "M"},
		{name: "custom type fallback", input: int(123), want: "S"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := convertToAttributeValue(tt.input)
			assert.NotNil(t, got)

			var typeName string
			switch got.(type) {
			case *types.AttributeValueMemberS:
				typeName = "S"
			case *types.AttributeValueMemberN:
				typeName = "N"
			case *types.AttributeValueMemberB:
				typeName = "B"
			case *types.AttributeValueMemberBOOL:
				typeName = "BOOL"
			case *types.AttributeValueMemberNULL:
				typeName = "NULL"
			case *types.AttributeValueMemberL:
				typeName = "L"
			case *types.AttributeValueMemberM:
				typeName = "M"
			case *types.AttributeValueMemberSS:
				typeName = "SS"
			case *types.AttributeValueMemberNS:
				typeName = "NS"
			}
			assert.Equal(t, tt.want, typeName, "type mismatch for input %v", tt.input)
		})
	}
}

func TestConvertToAttributeValue_MWithValueWrapper(t *testing.T) {
	t.Parallel()

	// {"M": {"Value": {"S": "hello"}}} should resolve to AttributeValueMemberS
	input := map[string]interface{}{
		"M": map[string]interface{}{
			"Value": map[string]interface{}{
				"S": "hello",
			},
		},
	}
	got := convertToAttributeValue(input)
	assert.NotNil(t, got)
	sv, ok := got.(*types.AttributeValueMemberS)
	assert.True(t, ok, "expected S type from M.Value wrapper")
	assert.Equal(t, "hello", sv.Value)
}

// ---------------------------------------------------------------------------
// Test convertMapToAttributeValue
// ---------------------------------------------------------------------------

func TestConvertMapToAttributeValue(t *testing.T) {
	t.Parallel()

	t.Run("nil input returns nil", func(t *testing.T) {
		t.Parallel()
		result := convertMapToAttributeValue(nil)
		assert.Nil(t, result)
	})

	t.Run("map with values returns non-nil result", func(t *testing.T) {
		t.Parallel()
		input := map[string]interface{}{
			"pk": map[string]interface{}{"S": "val1"},
		}
		result := convertMapToAttributeValue(input)
		assert.NotNil(t, result)
		assert.Len(t, result, 1)
		attr, ok := result["pk"].(*types.AttributeValueMemberS)
		assert.True(t, ok)
		assert.Equal(t, "val1", attr.Value)
	})

	t.Run("empty map returns empty result", func(t *testing.T) {
		t.Parallel()
		result := convertMapToAttributeValue(map[string]interface{}{})
		assert.NotNil(t, result)
		assert.Empty(t, result)
	})

	t.Run("multiple keys", func(t *testing.T) {
		t.Parallel()
		input := map[string]interface{}{
			"pk": map[string]interface{}{"S": "val1"},
			"sk": map[string]interface{}{"N": "42"},
		}
		result := convertMapToAttributeValue(input)
		assert.NotNil(t, result)
		assert.Len(t, result, 2)
	})
}
