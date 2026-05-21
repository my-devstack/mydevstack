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
		target     string
		body       string
		setupMock  func(mp *mockports.SNSPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []snsCase{
		// ListTopics
		{name: "ListTopics/success", target: "ListTopics", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListTopics(mock.Anything, mock.Anything).Return(&sns.ListTopicsOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListTopics/error", target: "ListTopics", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListTopics(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListTopics/parse-error", target: "ListTopics", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateTopic
		{name: "CreateTopic/success", target: "CreateTopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().CreateTopic(mock.Anything, mock.Anything).Return(&sns.CreateTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateTopic/error", target: "CreateTopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().CreateTopic(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateTopic/parse-error", target: "CreateTopic", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteTopic
		{name: "DeleteTopic/success", target: "DeleteTopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().DeleteTopic(mock.Anything, mock.Anything).Return(&sns.DeleteTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteTopic/error", target: "DeleteTopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().DeleteTopic(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteTopic/parse-error", target: "DeleteTopic", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Subscribe
		{name: "Subscribe/success", target: "Subscribe", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Subscribe(mock.Anything, mock.Anything).Return(&sns.SubscribeOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Subscribe/error", target: "Subscribe", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Subscribe(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Subscribe/parse-error", target: "Subscribe", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unsubscribe
		{name: "Unsubscribe/success", target: "Unsubscribe", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Unsubscribe(mock.Anything, mock.Anything).Return(&sns.UnsubscribeOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Unsubscribe/error", target: "Unsubscribe", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Unsubscribe(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Unsubscribe/parse-error", target: "Unsubscribe", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// ListSubscriptionsByTopic (without TopicArn)
		{name: "ListSubscriptionsByTopic/success-no-topic-arn", target: "ListSubscriptionsByTopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptionsByTopic(mock.Anything, mock.Anything).Return(&sns.ListSubscriptionsByTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		// ListSubscriptionsByTopic (with TopicArn)
		{name: "ListSubscriptionsByTopic/success-with-topic-arn", target: "ListSubscriptionsByTopic", body: `{"TopicArn":"arn:aws:sns:us-east-1:123456789012:test"}`,
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptionsByTopic(mock.Anything, mock.Anything).Return(&sns.ListSubscriptionsByTopicOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSubscriptionsByTopic/error", target: "ListSubscriptionsByTopic", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptionsByTopic(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListSubscriptionsByTopic/parse-error", target: "ListSubscriptionsByTopic", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// ListSubscriptions
		{name: "ListSubscriptions/success", target: "ListSubscriptions", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptions(mock.Anything, mock.Anything).Return(&sns.ListSubscriptionsOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSubscriptions/error", target: "ListSubscriptions", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().ListSubscriptions(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListSubscriptions/parse-error", target: "ListSubscriptions", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Publish
		{name: "Publish/success", target: "Publish", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Publish(mock.Anything, mock.Anything).Return(&sns.PublishOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Publish/error", target: "Publish", body: "{}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
				svc.EXPECT().SNS().Return(mp)
				mp.EXPECT().Publish(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Publish/parse-error", target: "Publish", body: "{invalid}",
			setupMock: func(mp *mockports.SNSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unknown SNS action
		{name: "unknown action", target: "UnknownSNSAction", body: "{}",
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

			w := performRequest(r, "POST", "/sns", tc.target, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "target=%q body=%q response=%s", tc.target, tc.body, w.Body.String())
		})
	}
}
