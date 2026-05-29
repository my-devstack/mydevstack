package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/kms"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestKMSHandler(t *testing.T) {
	t.Parallel()

	type kmsCase struct {
		name       string
		method     string
		path       string
		body       string
		setupMock  func(mp *mockports.KMSPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []kmsCase{
		// ListKeys
		{name: "ListKeys/success", method: "GET", path: "/kms/keys", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().ListKeys(mock.Anything, mock.Anything).Return(&kms.ListKeysOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListKeys/error", method: "GET", path: "/kms/keys", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().ListKeys(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListKeys/parse-error", method: "GET", path: "/kms/keys", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateKey
		{name: "CreateKey/success", method: "POST", path: "/kms/keys", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().CreateKey(mock.Anything, mock.Anything).Return(&kms.CreateKeyOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateKey/error", method: "POST", path: "/kms/keys", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().CreateKey(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateKey/parse-error", method: "POST", path: "/kms/keys", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteAlias
		{name: "DeleteAlias/success", method: "DELETE", path: "/kms/aliases/testalias", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DeleteAlias(mock.Anything, mock.Anything).Return(&kms.DeleteAliasOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteAlias/error", method: "DELETE", path: "/kms/aliases/testalias", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DeleteAlias(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// DescribeKey
		{name: "DescribeKey/success", method: "GET", path: "/kms/keys/testkey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DescribeKey(mock.Anything, mock.Anything).Return(&kms.DescribeKeyOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DescribeKey/error", method: "GET", path: "/kms/keys/testkey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DescribeKey(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},

		// Encrypt
		{name: "Encrypt/success", method: "POST", path: "/kms/encrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Encrypt(mock.Anything, mock.Anything).Return(&kms.EncryptOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Encrypt/error", method: "POST", path: "/kms/encrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Encrypt(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Encrypt/parse-error", method: "POST", path: "/kms/encrypt", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Decrypt
		{name: "Decrypt/success", method: "POST", path: "/kms/decrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Decrypt(mock.Anything, mock.Anything).Return(&kms.DecryptOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Decrypt/error", method: "POST", path: "/kms/decrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Decrypt(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Decrypt/parse-error", method: "POST", path: "/kms/decrypt", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GenerateDataKey
		{name: "GenerateDataKey/success", method: "POST", path: "/kms/generate-data-key", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateDataKey(mock.Anything, mock.Anything).Return(&kms.GenerateDataKeyOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GenerateDataKey/error", method: "POST", path: "/kms/generate-data-key", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateDataKey(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GenerateDataKey/parse-error", method: "POST", path: "/kms/generate-data-key", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GenerateRandom
		{name: "GenerateRandom/success", method: "POST", path: "/kms/generate-random", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateRandom(mock.Anything, mock.Anything).Return(&kms.GenerateRandomOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GenerateRandom/error", method: "POST", path: "/kms/generate-random", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateRandom(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GenerateRandom/parse-error", method: "POST", path: "/kms/generate-random", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

	}

	for _, tc := range cases {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()

			svc := createMockSvc(t, nil)
			mp := mockports.NewKMSPort(t)
			tc.setupMock(mp, svc)
			versionSvc := createTestVersionService(t)
			handler := createHandler(svc, versionSvc)
			r := setupTestRouter(handler)

			w := performRequest(r, tc.method, tc.path, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "method=%q path=%q body=%q response=%s", tc.method, tc.path, tc.body, w.Body.String())
		})
	}
}
