package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/sqs"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSQSHandler(t *testing.T) {
	t.Parallel()

	type sqsCase struct {
		name       string
		target     string
		body       string
		setupMock  func(mp *mockports.SQSPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []sqsCase{
		// ListQueues
		{name: "ListQueues/success", target: "ListQueues", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().ListQueues(mock.Anything, mock.Anything).Return(&sqs.ListQueuesOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListQueues/error", target: "ListQueues", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().ListQueues(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		// ListQueues
		{name: "ListQueues/parse-error", target: "ListQueues", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateQueue
		{name: "CreateQueue/success", target: "CreateQueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().CreateQueue(mock.Anything, mock.Anything).Return(&sqs.CreateQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateQueue/error", target: "CreateQueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().CreateQueue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateQueue/parse-error", target: "CreateQueue", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteQueue
		{name: "DeleteQueue/success", target: "DeleteQueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().DeleteQueue(mock.Anything, mock.Anything).Return(&sqs.DeleteQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteQueue/error", target: "DeleteQueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().DeleteQueue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteQueue/parse-error", target: "DeleteQueue", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GetQueueUrl
		{name: "GetQueueUrl/success", target: "GetQueueUrl", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(&sqs.GetQueueUrlOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetQueueUrl/error", target: "GetQueueUrl", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueUrl(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GetQueueUrl/parse-error", target: "GetQueueUrl", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// SendMessage
		{name: "SendMessage/success", target: "SendMessage", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().SendMessage(mock.Anything, mock.Anything).Return(&sqs.SendMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "SendMessage/error", target: "SendMessage", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().SendMessage(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "SendMessage/parse-error", target: "SendMessage", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// ReceiveMessage
		{name: "ReceiveMessage/success", target: "ReceiveMessage", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().ReceiveMessage(mock.Anything, mock.Anything).Return(&sqs.ReceiveMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ReceiveMessage/error", target: "ReceiveMessage", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().ReceiveMessage(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ReceiveMessage/parse-error", target: "ReceiveMessage", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteMessage
		{name: "DeleteMessage/success", target: "DeleteMessage", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().DeleteMessage(mock.Anything, mock.Anything).Return(&sqs.DeleteMessageOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteMessage/error", target: "DeleteMessage", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().DeleteMessage(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteMessage/parse-error", target: "DeleteMessage", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// PurgeQueue
		{name: "PurgeQueue/success", target: "PurgeQueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().PurgeQueue(mock.Anything, mock.Anything).Return(&sqs.PurgeQueueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "PurgeQueue/error", target: "PurgeQueue", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().PurgeQueue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "PurgeQueue/parse-error", target: "PurgeQueue", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GetQueueAttributes
		{name: "GetQueueAttributes/success", target: "GetQueueAttributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueAttributes(mock.Anything, mock.Anything).Return(&sqs.GetQueueAttributesOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetQueueAttributes/error", target: "GetQueueAttributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().GetQueueAttributes(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GetQueueAttributes/parse-error", target: "GetQueueAttributes", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// SetQueueAttributes
		{name: "SetQueueAttributes/success", target: "SetQueueAttributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().SetQueueAttributes(mock.Anything, mock.Anything).Return(&sqs.SetQueueAttributesOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "SetQueueAttributes/error", target: "SetQueueAttributes", body: "{}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SQS().Return(mp)
				mp.EXPECT().SetQueueAttributes(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "SetQueueAttributes/parse-error", target: "SetQueueAttributes", body: "{invalid}",
			setupMock: func(mp *mockports.SQSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unknown SQS action
		{name: "unknown action", target: "UnknownSQSAction", body: "{}",
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

			w := performRequest(r, "POST", "/sqs", tc.target, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "target=%q body=%q response=%s", tc.target, tc.body, w.Body.String())
		})
	}
}
