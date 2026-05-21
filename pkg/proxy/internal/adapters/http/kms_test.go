package httphandlers

import (
	"encoding/json"
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
		target     string
		body       string
		setupMock  func(mp *mockports.KMSPort, svc *mockports.ProxyService)
		wantStatus int
	}

	cases := []kmsCase{
		// ListKeys
		{name: "ListKeys/success", target: "ListKeys", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().ListKeys(mock.Anything, mock.Anything).Return(&kms.ListKeysOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "ListKeys/error", target: "ListKeys", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().ListKeys(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "ListKeys/parse-error", target: "ListKeys", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// CreateKey
		{name: "CreateKey/success", target: "CreateKey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().CreateKey(mock.Anything, mock.Anything).Return(&kms.CreateKeyOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "CreateKey/error", target: "CreateKey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().CreateKey(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "CreateKey/parse-error", target: "CreateKey", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DeleteAlias
		{name: "DeleteAlias/success", target: "DeleteAlias", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DeleteAlias(mock.Anything, mock.Anything).Return(&kms.DeleteAliasOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DeleteAlias/error", target: "DeleteAlias", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DeleteAlias(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DeleteAlias/parse-error", target: "DeleteAlias", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// DescribeKey
		{name: "DescribeKey/success", target: "DescribeKey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DescribeKey(mock.Anything, mock.Anything).Return(&kms.DescribeKeyOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "DescribeKey/error", target: "DescribeKey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().DescribeKey(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "DescribeKey/parse-error", target: "DescribeKey", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Encrypt
		{name: "Encrypt/success", target: "Encrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Encrypt(mock.Anything, mock.Anything).Return(&kms.EncryptOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Encrypt/error", target: "Encrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Encrypt(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Encrypt/parse-error", target: "Encrypt", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Decrypt
		{name: "Decrypt/success", target: "Decrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Decrypt(mock.Anything, mock.Anything).Return(&kms.DecryptOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "Decrypt/error", target: "Decrypt", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().Decrypt(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "Decrypt/parse-error", target: "Decrypt", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GenerateDataKey
		{name: "GenerateDataKey/success", target: "GenerateDataKey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateDataKey(mock.Anything, mock.Anything).Return(&kms.GenerateDataKeyOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GenerateDataKey/error", target: "GenerateDataKey", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateDataKey(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GenerateDataKey/parse-error", target: "GenerateDataKey", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// GenerateRandom
		{name: "GenerateRandom/success", target: "GenerateRandom", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateRandom(mock.Anything, mock.Anything).Return(&kms.GenerateRandomOutput{}, nil)
			}, wantStatus: http.StatusOK},
		{name: "GenerateRandom/error", target: "GenerateRandom", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
				svc.EXPECT().KMS().Return(mp)
				mp.EXPECT().GenerateRandom(mock.Anything, mock.Anything).Return(nil, errors.New("test error"))
			}, wantStatus: http.StatusInternalServerError},
		{name: "GenerateRandom/parse-error", target: "GenerateRandom", body: "{invalid}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusBadRequest},

		// Unknown KMS action: genericKMS handles with valid body → 200
		{name: "genericKMS/success", target: "SomeUnknownKMSAction", body: "{}",
			setupMock: func(mp *mockports.KMSPort, svc *mockports.ProxyService) {
			}, wantStatus: http.StatusOK},
		// Unknown KMS action: genericKMS with invalid body → 400
		{name: "genericKMS/parse-error", target: "SomeUnknownKMSAction", body: "{invalid}",
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

			w := performRequest(r, "POST", "/kms", tc.target, []byte(tc.body))
			assert.Equal(t, tc.wantStatus, w.Code, "target=%q body=%q response=%s", tc.target, tc.body, w.Body.String())

			// For genericKMS success, verify the response message
			if tc.name == "genericKMS/success" {
				var resp map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &resp)
				assert.NoError(t, err)
				assert.Equal(t, "Action SomeUnknownKMSAction handled", resp["message"])
			}
		})
	}
}
