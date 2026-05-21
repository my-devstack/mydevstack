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
		target     string
		body       string
		setupMock  func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []smCase{
		// ListSecrets
		{name: "ListSecrets/success", target: "ListSecrets", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().ListSecrets(mock.Anything, mock.Anything).Return(&secretsmanager.ListSecretsOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListSecrets/error", target: "ListSecrets", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().ListSecrets(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListSecrets/parse-error", target: "ListSecrets", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateSecret
		{name: "CreateSecret/success", target: "CreateSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().CreateSecret(mock.Anything, mock.Anything).Return(&secretsmanager.CreateSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateSecret/error", target: "CreateSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().CreateSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateSecret/parse-error", target: "CreateSecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GetSecretValue
		{name: "GetSecretValue/success", target: "GetSecretValue", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetSecretValue(mock.Anything, mock.Anything).Return(&secretsmanager.GetSecretValueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetSecretValue/error", target: "GetSecretValue", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetSecretValue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GetSecretValue/parse-error", target: "GetSecretValue", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// PutSecretValue
		{name: "PutSecretValue/success", target: "PutSecretValue", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().PutSecretValue(mock.Anything, mock.Anything).Return(&secretsmanager.PutSecretValueOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "PutSecretValue/error", target: "PutSecretValue", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().PutSecretValue(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "PutSecretValue/parse-error", target: "PutSecretValue", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteSecret
		{name: "DeleteSecret/success", target: "DeleteSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DeleteSecret(mock.Anything, mock.Anything).Return(&secretsmanager.DeleteSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteSecret/error", target: "DeleteSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DeleteSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteSecret/parse-error", target: "DeleteSecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DescribeSecret
		{name: "DescribeSecret/success", target: "DescribeSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DescribeSecret(mock.Anything, mock.Anything).Return(&secretsmanager.DescribeSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DescribeSecret/error", target: "DescribeSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().DescribeSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DescribeSecret/parse-error", target: "DescribeSecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// UpdateSecret
		{name: "UpdateSecret/success", target: "UpdateSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().UpdateSecret(mock.Anything, mock.Anything).Return(&secretsmanager.UpdateSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "UpdateSecret/error", target: "UpdateSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().UpdateSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "UpdateSecret/parse-error", target: "UpdateSecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// RestoreSecret
		{name: "RestoreSecret/success", target: "RestoreSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RestoreSecret(mock.Anything, mock.Anything).Return(&secretsmanager.RestoreSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "RestoreSecret/error", target: "RestoreSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RestoreSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "RestoreSecret/parse-error", target: "RestoreSecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// RotateSecret
		{name: "RotateSecret/success", target: "RotateSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RotateSecret(mock.Anything, mock.Anything).Return(&secretsmanager.RotateSecretOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "RotateSecret/error", target: "RotateSecret", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().RotateSecret(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "RotateSecret/parse-error", target: "RotateSecret", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GetRandomPassword
		{name: "GetRandomPassword/success", target: "GetRandomPassword", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetRandomPassword(mock.Anything, mock.Anything).Return(&secretsmanager.GetRandomPasswordOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GetRandomPassword/error", target: "GetRandomPassword", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
				svc.EXPECT().SecretsManager().Return(mp)
				mp.EXPECT().GetRandomPassword(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GetRandomPassword/parse-error", target: "GetRandomPassword", body: "{invalid}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unknown Secrets Manager action
		{name: "unknown action", target: "UnknownSecretsManagerAction", body: "{}",
			setupMock: func(mp *mockports.SecretsManagerPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},
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

			w := performRequest(r, "POST", "/secretsmanager", tc.target, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "target=%q body=%q response=%s", tc.target, tc.body, w.Body.String())
		})
	}
}
