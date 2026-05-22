package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSecretsManagerHandler(t *testing.T) {
	t.Parallel()

	type smCase struct {
		name       string
		method     string
		path       string
		body       string
		setupMock  func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []smCase{
		// ListSecrets
		{name: "ListSecrets/success", method: "GET", path: "/secrets-manager/secrets", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().ListSecrets(mock.Anything, mock.Anything).Return(&secretsmanager.ListSecretsOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSecrets/error", method: "GET", path: "/secrets-manager/secrets", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().ListSecrets(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListSecrets/parse-error", method: "GET", path: "/secrets-manager/secrets", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateSecret
		{name: "CreateSecret/success", method: "POST", path: "/secrets-manager/secrets", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().CreateSecret(mock.Anything, mock.Anything).Return(&secretsmanager.CreateSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateSecret/error", method: "POST", path: "/secrets-manager/secrets", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().CreateSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateSecret/parse-error", method: "POST", path: "/secrets-manager/secrets", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GetSecretValue
		{name: "GetSecretValue/success", method: "GET", path: "/secrets-manager/secrets/testsecret/value", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetSecretValue(mock.Anything, mock.Anything).Return(&secretsmanager.GetSecretValueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetSecretValue/error", method: "GET", path: "/secrets-manager/secrets/testsecret/value", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetSecretValue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// PutSecretValue
		{name: "PutSecretValue/success", method: "PUT", path: "/secrets-manager/secrets/testsecret/value", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().PutSecretValue(mock.Anything, mock.Anything).Return(&secretsmanager.PutSecretValueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "PutSecretValue/error", method: "PUT", path: "/secrets-manager/secrets/testsecret/value", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().PutSecretValue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "PutSecretValue/parse-error", method: "PUT", path: "/secrets-manager/secrets/testsecret/value", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteSecret
		{name: "DeleteSecret/success", method: "DELETE", path: "/secrets-manager/secrets/testsecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DeleteSecret(mock.Anything, mock.Anything).Return(&secretsmanager.DeleteSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteSecret/error", method: "DELETE", path: "/secrets-manager/secrets/testsecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DeleteSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteSecret/parse-error", method: "DELETE", path: "/secrets-manager/secrets/testsecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DescribeSecret
		{name: "DescribeSecret/success", method: "GET", path: "/secrets-manager/secrets/testsecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DescribeSecret(mock.Anything, mock.Anything).Return(&secretsmanager.DescribeSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DescribeSecret/error", method: "GET", path: "/secrets-manager/secrets/testsecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DescribeSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// UpdateSecret
		{name: "UpdateSecret/success", method: "PUT", path: "/secrets-manager/secrets/testsecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().UpdateSecret(mock.Anything, mock.Anything).Return(&secretsmanager.UpdateSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "UpdateSecret/error", method: "PUT", path: "/secrets-manager/secrets/testsecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().UpdateSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "UpdateSecret/parse-error", method: "PUT", path: "/secrets-manager/secrets/testsecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// RestoreSecret
		{name: "RestoreSecret/success", method: "POST", path: "/secrets-manager/secrets/testsecret/restore", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RestoreSecret(mock.Anything, mock.Anything).Return(&secretsmanager.RestoreSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "RestoreSecret/error", method: "POST", path: "/secrets-manager/secrets/testsecret/restore", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RestoreSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// RotateSecret
		{name: "RotateSecret/success", method: "POST", path: "/secrets-manager/secrets/testsecret/rotate", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RotateSecret(mock.Anything, mock.Anything).Return(&secretsmanager.RotateSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "RotateSecret/error", method: "POST", path: "/secrets-manager/secrets/testsecret/rotate", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RotateSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "RotateSecret/parse-error", method: "POST", path: "/secrets-manager/secrets/testsecret/rotate", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GetRandomPassword
		{name: "GetRandomPassword/success", method: "POST", path: "/secrets-manager/random-password", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetRandomPassword(mock.Anything, mock.Anything).Return(&secretsmanager.GetRandomPasswordOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetRandomPassword/error", method: "POST", path: "/secrets-manager/random-password", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetRandomPassword(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GetRandomPassword/parse-error", method: "POST", path: "/secrets-manager/random-password", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unknown Secrets Manager action
		{name: "unknown action", method: "GET", path: "/secrets-manager/unknown", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusNotFound},
	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			svc := createMockSvc(t, nil)
			mp := mockports.NewSecretsManagerPort(t)
			tc.setupMock(mp, svc)
			versionSvc := createTestVersionService(t)
			handler := createHandler(svc, versionSvc)
			r := setupTestRouter(handler)

			w := performRequest(r, tc.method, tc.path, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "method=%q path=%q body=%q response=%s", tc.method, tc.path, tc.body, w.Body.String())
		})
	}
}
