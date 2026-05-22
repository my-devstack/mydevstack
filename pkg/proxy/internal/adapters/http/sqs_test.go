package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSQSHandler(t *testing.T) {
	t.Parallel()

	type sqsCase struct {
		name       string
		method     string
		path       string
		body       string
		setupMock  func(mp *mockports.SQSPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []sqsCase{
		// ListQueues
		{name: "ListQueues/success", method: "GET", path: "/sqs/queues", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().ListQueues(mock.Anything, mock.Anything).Return(&sqs.ListQueuesOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListQueues/error", method: "GET", path: "/sqs/queues", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().ListQueues(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		// ListQueues
		{name: "ListQueues/parse-error", method: "GET", path: "/sqs/queues", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateQueue
		{name: "CreateQueue/success", method: "POST", path: "/sqs/queues", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().CreateQueue(mock.Anything, mock.Anything).Return(&sqs.CreateQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateQueue/error", method: "POST", path: "/sqs/queues", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().CreateQueue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateQueue/parse-error", method: "POST", path: "/sqs/queues", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteQueue
		{name: "DeleteQueue/success", method: "DELETE", path: "/sqs/queues/testqueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().DeleteQueue(mock.Anything, mock.Anything).Return(&sqs.DeleteQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteQueue/error", method: "DELETE", path: "/sqs/queues/testqueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().DeleteQueue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteQueue/get-queue-url-error", method: "DELETE", path: "/sqs/queues/testqueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
			}, wantStatus: http.StatusInternalServerError},

		// GetQueueUrl
		{name: "GetQueueUrl/success", method: "GET", path: "/sqs/queues/testqueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetQueueUrl/error", method: "GET", path: "/sqs/queues/testqueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// SendMessage
		{name: "SendMessage/success", method: "POST", path: "/sqs/queues/testqueue/messages", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().SendMessage(mock.Anything, mock.Anything).Return(&sqs.SendMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "SendMessage/error", method: "POST", path: "/sqs/queues/testqueue/messages", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().SendMessage(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "SendMessage/get-queue-url-error", method: "POST", path: "/sqs/queues/testqueue/messages", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "SendMessage/parse-error", method: "POST", path: "/sqs/queues/testqueue/messages", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
			}, wantStatus: http.StatusBadRequest},

		// ReceiveMessage
		{name: "ReceiveMessage/success", method: "GET", path: "/sqs/queues/testqueue/messages", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().ReceiveMessage(mock.Anything, mock.Anything).Return(&sqs.ReceiveMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ReceiveMessage/error", method: "GET", path: "/sqs/queues/testqueue/messages", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().ReceiveMessage(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ReceiveMessage/get-queue-url-error", method: "GET", path: "/sqs/queues/testqueue/messages", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ReceiveMessage/empty-params", method: "GET", path: "/sqs/queues/testqueue/messages", body: "",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().ReceiveMessage(mock.Anything, mock.Anything).Return(&sqs.ReceiveMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},

		// DeleteMessage
		{name: "DeleteMessage/success", method: "DELETE", path: "/sqs/queues/testqueue/messages/testreceipt", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().DeleteMessage(mock.Anything, mock.Anything).Return(&sqs.DeleteMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteMessage/error", method: "DELETE", path: "/sqs/queues/testqueue/messages/testreceipt", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().DeleteMessage(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteMessage/get-queue-url-error", method: "DELETE", path: "/sqs/queues/testqueue/messages/testreceipt", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
			}, wantStatus: http.StatusInternalServerError},

		// PurgeQueue
		{name: "PurgeQueue/success", method: "POST", path: "/sqs/queues/testqueue/purge", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().PurgeQueue(mock.Anything, mock.Anything).Return(&sqs.PurgeQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "PurgeQueue/error", method: "POST", path: "/sqs/queues/testqueue/purge", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().PurgeQueue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "PurgeQueue/get-queue-url-error", method: "POST", path: "/sqs/queues/testqueue/purge", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "PurgeQueue/empty-params", method: "POST", path: "/sqs/queues/testqueue/purge", body: "",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().PurgeQueue(mock.Anything, mock.Anything).Return(&sqs.PurgeQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},

		// GetQueueAttributes
		{name: "GetQueueAttributes/success", method: "GET", path: "/sqs/queues/testqueue/attributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().GetQueueAttributes(mock.Anything, mock.Anything).Return(&sqs.GetQueueAttributesOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetQueueAttributes/error", method: "GET", path: "/sqs/queues/testqueue/attributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{QueueUrl: aws.String("http://localhost/testqueue")}, nil)
				mp.EXPECT().GetQueueAttributes(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GetQueueAttributes/get-queue-url-error", method: "GET", path: "/sqs/queues/testqueue/attributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("not found"))
			}, wantStatus: http.StatusInternalServerError},

		// SetQueueAttributes
		{name: "SetQueueAttributes/success", method: "PUT", path: "/sqs/queues/testqueue/attributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().SetQueueAttributes(mock.Anything, mock.Anything).Return(&sqs.SetQueueAttributesOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "SetQueueAttributes/error", method: "PUT", path: "/sqs/queues/testqueue/attributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().SetQueueAttributes(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "SetQueueAttributes/parse-error", method: "PUT", path: "/sqs/queues/testqueue/attributes", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			svc := createMockSvc(t, nil)
			mp := mockports.NewSQSPort(t)
			tc.setupMock(mp, svc)
			versionSvc := createTestVersionService(t)
			handler := createHandler(svc, versionSvc)
			r := setupTestRouter(handler)

			w := performRequest(r, tc.method, tc.path, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "method=%q path=%q body=%q response=%s", tc.method, tc.path, tc.body, w.Body.String())
		})
	}
}
