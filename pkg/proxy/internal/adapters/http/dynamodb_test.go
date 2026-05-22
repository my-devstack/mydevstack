package httphandlers

import (
	"bytes"
	"context"
	"encoding/base64"
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
		w := performRequest(r, "GET", "/dynamodb/tables", []byte("{}"))
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
		w := performRequest(r, "GET", "/dynamodb/tables", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/tables", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/tables", []byte("{}"))
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
		w := performRequest(r, "GET", "/dynamodb/tables/test", []byte(`{"TableName":"test"}`))
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
		w := performRequest(r, "GET", "/dynamodb/tables/test", []byte(`{"TableName":"test"}`))
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
		w := performRequest(r, "GET", "/dynamodb/tables/bad", []byte(`{"TableName":"bad"}`))
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
		w := performRequest(r, "DELETE", "/dynamodb/tables/testtable", []byte("{}"))
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
		w := performRequest(r, "DELETE", "/dynamodb/tables/testtable", []byte("{}"))
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
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable", []byte("{}"))
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
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/items", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/items", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Item/ConditionExpression/ReturnValues", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().PutItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.PutItemInput) bool {
			// TableName comes from URL param /dynamodb/tables/testtable/items
			return input.TableName != nil && *input.TableName == "testtable" &&
				input.ConditionExpression != nil && *input.ConditionExpression == "attribute_not_exists(pk)" &&
				input.ReturnValues == types.ReturnValue("ALL_OLD") &&
				len(input.Item) > 0
		})).Return(&dynamodb.PutItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"Item":{"pk":{"S":"val1"},"sk":{"S":"val2"}},"ConditionExpression":"attribute_not_exists(pk)","ReturnValues":"ALL_OLD"}`
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/items", []byte(body))
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
		w := performRequest(r, "GET", "/dynamodb/tables/testtable/items/testkey", []byte("{}"))
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
		w := performRequest(r, "GET", "/dynamodb/tables/testtable/items/testkey", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Key/ConsistentRead/ProjectionExpression", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().GetItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.GetItemInput) bool {
			// TableName comes from URL param /dynamodb/tables/testtable/items/testkey
			return input.TableName != nil && *input.TableName == "testtable" &&
				input.ConsistentRead != nil && *input.ConsistentRead == true &&
				input.ProjectionExpression != nil && *input.ProjectionExpression == "pk, sk" &&
				len(input.Key) > 0
		})).Return(&dynamodb.GetItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"Key":{"pk":{"S":"val1"}},"ConsistentRead":true,"ProjectionExpression":"pk, sk"}`
		w := performRequest(r, "GET", "/dynamodb/tables/testtable/items/testkey", []byte(body))
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
		w := performRequest(r, "DELETE", "/dynamodb/tables/testtable/items/testkey", []byte("{}"))
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
		w := performRequest(r, "DELETE", "/dynamodb/tables/testtable/items/testkey", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Key/ConditionExpression/ReturnValues", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().DeleteItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.DeleteItemInput) bool {
			// TableName comes from URL param /dynamodb/tables/testtable/items/testkey
			return input.TableName != nil && *input.TableName == "testtable" &&
				input.ConditionExpression != nil && *input.ConditionExpression == "attribute_not_exists(pk)" &&
				input.ReturnValues == types.ReturnValue("ALL_OLD") &&
				len(input.Key) > 0
		})).Return(&dynamodb.DeleteItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"Key":{"pk":{"S":"val1"}},"ConditionExpression":"attribute_not_exists(pk)","ReturnValues":"ALL_OLD"}`
		w := performRequest(r, "DELETE", "/dynamodb/tables/testtable/items/testkey", []byte(body))
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
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable/items/testkey", []byte("{}"))
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
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable/items/testkey", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Key/UpdateExpression/ConditionExpression/ReturnValues", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().UpdateItem(mock.Anything, mock.MatchedBy(func(input *dynamodb.UpdateItemInput) bool {
			// TableName comes from URL param /dynamodb/tables/testtable/items/testkey
			return input.TableName != nil && *input.TableName == "testtable" &&
				input.UpdateExpression != nil && *input.UpdateExpression == "SET #n = :n" &&
				input.ConditionExpression != nil && *input.ConditionExpression == "attribute_not_exists(pk)" &&
				input.ReturnValues == types.ReturnValue("ALL_NEW") &&
				len(input.Key) > 0
		})).Return(&dynamodb.UpdateItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"Key":{"pk":{"S":"val1"}},"UpdateExpression":"SET #n = :n","ConditionExpression":"attribute_not_exists(pk)","ReturnValues":"ALL_NEW"}`
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable/items/testkey", []byte(body))
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
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/query", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/query", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/KeyConditionExpression/FilterExpression/Limit/ScanIndexForward/ExclusiveStartKey", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Query(mock.Anything, mock.MatchedBy(func(input *dynamodb.QueryInput) bool {
			// TableName comes from URL param /dynamodb/tables/testtable/query
			return input.TableName != nil && *input.TableName == "testtable" &&
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
		body := `{"KeyConditionExpression":"pk = :pk","FilterExpression":"sk > :sk","Limit":10,"ScanIndexForward":false,"ExclusiveStartKey":{"pk":{"S":"lastkey"}}}`
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/query", []byte(body))
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
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/scan", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/scan", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("custom body with TableName/Limit/FilterExpression/ProjectionExpression/ExclusiveStartKey", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().Scan(mock.Anything, mock.MatchedBy(func(input *dynamodb.ScanInput) bool {
			// TableName comes from URL param /dynamodb/tables/testtable/scan
			return input.TableName != nil && *input.TableName == "testtable" &&
				input.Limit != nil && *input.Limit == 100 &&
				input.FilterExpression != nil && *input.FilterExpression == "pk > :pk" &&
				input.ProjectionExpression != nil && *input.ProjectionExpression == "pk, sk" &&
				len(input.ExclusiveStartKey) > 0
		})).Return(&dynamodb.ScanOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		body := `{"Limit":100,"FilterExpression":"pk > :pk","ProjectionExpression":"pk, sk","ExclusiveStartKey":{"pk":{"S":"lastkey"}}}`
		w := performRequest(r, "POST", "/dynamodb/tables/testtable/scan", []byte(body))
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
		w := performRequest(r, "POST", "/dynamodb/batch-write-item", []byte("{}"))
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
		w := performRequest(r, "POST", "/dynamodb/batch-write-item", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// BatchGetItem – direct REST path /dynamodb/batch-get-item
// ---------------------------------------------------------------------------

func TestHandleDynamoDB_BatchGetItem(t *testing.T) {
	t.Parallel()

	t.Run("success", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		// REST path /dynamodb/batch-get-item routes to batchGetItem handler.
		mp.EXPECT().BatchGetItem(mock.Anything, mock.Anything).Return(&dynamodb.BatchGetItemOutput{}, nil)
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb/batch-get-item", []byte("{}"))
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		mp := mockports.NewDynamoDBPort(t)
		mp.EXPECT().BatchGetItem(mock.Anything, mock.Anything).Return(nil, errors.New("batch get error"))
		svc.EXPECT().DynamoDB().Return(mp)
		versionSvc := createTestVersionService(t)
		handler := NewProxyHandler(context.Background(), svc, versionSvc)
		r := setupTestRouter(handler)
		w := performRequest(r, "POST", "/dynamodb/batch-get-item", []byte("{}"))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// BatchGetItem — direct handler tests (bypass router)
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

		handler.batchGetItem(w, req)
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

		handler.batchGetItem(w, req)
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("parse error", func(t *testing.T) {
		t.Parallel()
		svc := createMockSvc(t, nil)
		versionSvc := createTestVersionService(t)
		handler := createHandler(svc, versionSvc)

		w := httptest.NewRecorder()
		req := httptest.NewRequest("POST", "/dynamodb", bytes.NewReader([]byte("{bad")))

		handler.batchGetItem(w, req)
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
		w := performRequest(r, "GET", "/dynamodb/tables/testtable/ttl", []byte("{}"))
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
		w := performRequest(r, "GET", "/dynamodb/tables/testtable/ttl", []byte("{}"))
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
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable/ttl", []byte("{}"))
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
		w := performRequest(r, "PUT", "/dynamodb/tables/testtable/ttl", []byte("{}"))
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
		method string
		path   string
		body   string
	}

	cases := []bodyCase{
		{name: "PutItem string", target: "PutItem", method: "POST", path: "/dynamodb/tables/testtable/items", body: `"not a map"`},
		{name: "GetItem string", target: "GetItem", method: "GET", path: "/dynamodb/tables/testtable/items/testkey", body: `"not a map"`},
		{name: "DeleteItem string", target: "DeleteItem", method: "DELETE", path: "/dynamodb/tables/testtable/items/testkey", body: `"not a map"`},
		{name: "UpdateItem string", target: "UpdateItem", method: "PUT", path: "/dynamodb/tables/testtable/items/testkey", body: `"not a map"`},
		{name: "Query string", target: "Query", method: "POST", path: "/dynamodb/tables/testtable/query", body: `"not a map"`},
		{name: "Scan string", target: "Scan", method: "POST", path: "/dynamodb/tables/testtable/scan", body: `"not a map"`},
		{name: "PutItem array", target: "PutItem", method: "POST", path: "/dynamodb/tables/testtable/items", body: `[1,2,3]`},
		{name: "GetItem array", target: "GetItem", method: "GET", path: "/dynamodb/tables/testtable/items/testkey", body: `[1,2,3]`},
		{name: "DeleteItem array", target: "DeleteItem", method: "DELETE", path: "/dynamodb/tables/testtable/items/testkey", body: `[1,2,3]`},
		{name: "UpdateItem array", target: "UpdateItem", method: "PUT", path: "/dynamodb/tables/testtable/items/testkey", body: `[1,2,3]`},
		{name: "Query array", target: "Query", method: "POST", path: "/dynamodb/tables/testtable/query", body: `[1,2,3]`},
		{name: "Scan array", target: "Scan", method: "POST", path: "/dynamodb/tables/testtable/scan", body: `[1,2,3]`},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			versionSvc := createTestVersionService(t)
			handler := NewProxyHandler(context.Background(), svc, versionSvc)
			r := setupTestRouter(handler)
			w := performRequest(r, tc.method, tc.path, []byte(tc.body))
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
		method string
		path   string
	}

	// Only include actions whose handlers parse the request body.
	// DescribeTable, DeleteTable, DescribeTimeToLive use URL params only.
	cases := []parseCase{
		{name: "ListTables", target: "ListTables", method: "GET", path: "/dynamodb/tables"},
		{name: "CreateTable", target: "CreateTable", method: "POST", path: "/dynamodb/tables"},
		{name: "UpdateTable", target: "UpdateTable", method: "PUT", path: "/dynamodb/tables/testtable"},
		{name: "PutItem", target: "PutItem", method: "POST", path: "/dynamodb/tables/testtable/items"},
		{name: "GetItem", target: "GetItem", method: "GET", path: "/dynamodb/tables/testtable/items/testkey"},
		{name: "DeleteItem", target: "DeleteItem", method: "DELETE", path: "/dynamodb/tables/testtable/items/testkey"},
		{name: "UpdateItem", target: "UpdateItem", method: "PUT", path: "/dynamodb/tables/testtable/items/testkey"},
		{name: "Query", target: "Query", method: "POST", path: "/dynamodb/tables/testtable/query"},
		{name: "Scan", target: "Scan", method: "POST", path: "/dynamodb/tables/testtable/scan"},
		{name: "BatchWriteItem", target: "BatchWriteItem", method: "POST", path: "/dynamodb/batch-write-item"},
		{name: "BatchGetItem", target: "BatchGetItem", method: "POST", path: "/dynamodb/batch-get-item"},
		{name: "UpdateTimeToLive", target: "UpdateTimeToLive", method: "PUT", path: "/dynamodb/tables/testtable/ttl"},
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
			w := performRequest(r, tc.method, tc.path, []byte("{bad json}"))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s", tc.target)
		})
	}
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
