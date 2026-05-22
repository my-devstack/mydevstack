package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/sns"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSNSHandler(t *testing.T) {
	t.Parallel()

	type snsCase struct {
		name       string
		method     string
		path       string
		body       string
		setupMock  func(mp *mockports.SNSPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []snsCase{
		// ListTopics
		{name: "ListTopics/success", method: "GET", path: "/sns/topics", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListTopics(mock.Anything, mock.Anything).Return(&sns.ListTopicsOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListTopics/error", method: "GET", path: "/sns/topics", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListTopics(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListTopics/parse-error", method: "GET", path: "/sns/topics", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateTopic
		{name: "CreateTopic/success", method: "POST", path: "/sns/topics", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().CreateTopic(mock.Anything, mock.Anything).Return(&sns.CreateTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateTopic/error", method: "POST", path: "/sns/topics", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().CreateTopic(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateTopic/parse-error", method: "POST", path: "/sns/topics", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteTopic
		{name: "DeleteTopic/success", method: "DELETE", path: "/sns/topics/testtopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().DeleteTopic(mock.Anything, mock.Anything).Return(&sns.DeleteTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteTopic/error", method: "DELETE", path: "/sns/topics/testtopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().DeleteTopic(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// Subscribe
		{name: "Subscribe/success", method: "POST", path: "/sns/subscriptions", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Subscribe(mock.Anything, mock.Anything).Return(&sns.SubscribeOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Subscribe/error", method: "POST", path: "/sns/subscriptions", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Subscribe(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Subscribe/parse-error", method: "POST", path: "/sns/subscriptions", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unsubscribe
		{name: "Unsubscribe/success", method: "DELETE", path: "/sns/subscriptions/testsub", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Unsubscribe(mock.Anything, mock.Anything).Return(&sns.UnsubscribeOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Unsubscribe/error", method: "DELETE", path: "/sns/subscriptions/testsub", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Unsubscribe(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// ListSubscriptionsByTopic
		{name: "ListSubscriptionsByTopic/success-no-topic-arn", method: "GET", path: "/sns/subscriptions/by-topic/testtopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptionsByTopic(mock.Anything, mock.Anything).Return(&sns.ListSubscriptionsByTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSubscriptionsByTopic/success-with-topic-arn", method: "GET", path: "/sns/subscriptions/by-topic/testtopic", body: `{"TopicArn":"arn:aws:sns:us-east-1:123456789012:test"}`,
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptionsByTopic(mock.Anything, mock.Anything).Return(&sns.ListSubscriptionsByTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSubscriptionsByTopic/error", method: "GET", path: "/sns/subscriptions/by-topic/testtopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptionsByTopic(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListSubscriptionsByTopic/parse-error", method: "GET", path: "/sns/subscriptions/by-topic/testtopic", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// ListSubscriptions
		{name: "ListSubscriptions/success", method: "GET", path: "/sns/subscriptions", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptions(mock.Anything, mock.Anything).Return(&sns.ListSubscriptionsOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSubscriptions/error", method: "GET", path: "/sns/subscriptions", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptions(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListSubscriptions/parse-error", method: "GET", path: "/sns/subscriptions", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Publish
		{name: "Publish/success", method: "POST", path: "/sns/publish", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Publish(mock.Anything, mock.Anything).Return(&sns.PublishOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Publish/error", method: "POST", path: "/sns/publish", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Publish(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Publish/parse-error", method: "POST", path: "/sns/publish", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			svc := createMockSvc(t, nil)
			mp := mockports.NewSNSPort(t)
			tc.setupMock(mp, svc)
			versionSvc := createTestVersionService(t)
			handler := createHandler(svc, versionSvc)
			r := setupTestRouter(handler)

			w := performRequest(r, tc.method, tc.path, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "method=%q path=%q body=%q response=%s", tc.method, tc.path, tc.body, w.Body.String())
		})
	}
}
