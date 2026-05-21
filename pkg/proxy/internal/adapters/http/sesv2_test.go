package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestSESv2Actions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.SESv2Port)
	}{
		{name: "ListEmailIdentities", target: "ListEmailIdentities", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().ListEmailIdentities(mock.Anything, mock.Anything).Return(&sesv2.ListEmailIdentitiesOutput{}, nil)
		}},
		{name: "GetEmailIdentity", target: "GetEmailIdentity", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().GetEmailIdentity(mock.Anything, mock.Anything).Return(&sesv2.GetEmailIdentityOutput{}, nil)
		}},
		{name: "CreateEmailIdentity", target: "CreateEmailIdentity", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().CreateEmailIdentity(mock.Anything, mock.Anything).Return(&sesv2.CreateEmailIdentityOutput{}, nil)
		}},
		{name: "DeleteEmailIdentity", target: "DeleteEmailIdentity", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().DeleteEmailIdentity(mock.Anything, mock.Anything).Return(&sesv2.DeleteEmailIdentityOutput{}, nil)
		}},
		{name: "SendEmail", target: "SendEmail", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().SendEmail(mock.Anything, mock.Anything).Return(&sesv2.SendEmailOutput{}, nil)
		}},
		{name: "SendBulkEmail", target: "SendBulkEmail", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().SendBulkEmail(mock.Anything, mock.Anything).Return(&sesv2.SendBulkEmailOutput{}, nil)
		}},
		{name: "ListEmailTemplates", target: "ListEmailTemplates", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().ListEmailTemplates(mock.Anything, mock.Anything).Return(&sesv2.ListEmailTemplatesOutput{}, nil)
		}},
		{name: "GetEmailTemplate", target: "GetEmailTemplate", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().GetEmailTemplate(mock.Anything, mock.Anything).Return(&sesv2.GetEmailTemplateOutput{}, nil)
		}},
		{name: "CreateEmailTemplate", target: "CreateEmailTemplate", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().CreateEmailTemplate(mock.Anything, mock.Anything).Return(&sesv2.CreateEmailTemplateOutput{}, nil)
		}},
		{name: "UpdateEmailTemplate", target: "UpdateEmailTemplate", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().UpdateEmailTemplate(mock.Anything, mock.Anything).Return(&sesv2.UpdateEmailTemplateOutput{}, nil)
		}},
		{name: "DeleteEmailTemplate", target: "DeleteEmailTemplate", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().DeleteEmailTemplate(mock.Anything, mock.Anything).Return(&sesv2.DeleteEmailTemplateOutput{}, nil)
		}},
		{name: "GetAccount", target: "GetAccount", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().GetAccount(mock.Anything, mock.Anything).Return(&sesv2.GetAccountOutput{}, nil)
		}},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewSESv2Port(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().SESv2().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/sesv2", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestSESv2_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/sesv2", "SendEmail", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestSESv2_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewSESv2Port(t)
	mp.EXPECT().ListEmailIdentities(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().SESv2().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/sesv2", "ListEmailIdentities", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestSESv2_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/sesv2", "UnknownSESAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestSESv2_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.SESv2Port)
	}{
		{
			name: "GetEmailIdentity", target: "GetEmailIdentity",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().GetEmailIdentity(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateEmailIdentity", target: "CreateEmailIdentity",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().CreateEmailIdentity(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteEmailIdentity", target: "DeleteEmailIdentity",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().DeleteEmailIdentity(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "SendBulkEmail", target: "SendBulkEmail",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().SendBulkEmail(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListEmailTemplates", target: "ListEmailTemplates",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().ListEmailTemplates(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetEmailTemplate", target: "GetEmailTemplate",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().GetEmailTemplate(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateEmailTemplate", target: "CreateEmailTemplate",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().CreateEmailTemplate(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UpdateEmailTemplate", target: "UpdateEmailTemplate",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().UpdateEmailTemplate(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteEmailTemplate", target: "DeleteEmailTemplate",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().DeleteEmailTemplate(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetAccount", target: "GetAccount",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().GetAccount(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "SendEmail", target: "SendEmail",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().SendEmail(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewSESv2Port(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().SESv2().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/sesv2", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestSESv2_ParseErrors(t *testing.T) {
	t.Parallel()

	targets := []string{
		"ListEmailIdentities", "GetEmailIdentity", "CreateEmailIdentity",
		"DeleteEmailIdentity", "SendEmail", "SendBulkEmail",
		"ListEmailTemplates", "GetEmailTemplate", "CreateEmailTemplate",
		"UpdateEmailTemplate", "DeleteEmailTemplate", "GetAccount",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/sesv2", target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
		})
	}
}
