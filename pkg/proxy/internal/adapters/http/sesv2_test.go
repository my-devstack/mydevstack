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

	// Only include non-stub handlers (ones that call the service port).
	// Stubs (createEmailTemplate, getEmailTemplate, listEmailTemplates, etc.)
	// return 200 directly without calling the port, so they can't be tested here.
	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.SESv2Port)
	}{
		{name: "ListEmailIdentities", method: "GET", path: "/sesv2/email-identities", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().ListEmailIdentities(mock.Anything, mock.Anything).Return(&sesv2.ListEmailIdentitiesOutput{}, nil)
		}},
		{name: "GetEmailIdentity", method: "GET", path: "/sesv2/email-identities/test@example.com", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().GetEmailIdentity(mock.Anything, mock.Anything).Return(&sesv2.GetEmailIdentityOutput{}, nil)
		}},
		{name: "CreateEmailIdentity", method: "POST", path: "/sesv2/email-identities", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().CreateEmailIdentity(mock.Anything, mock.Anything).Return(&sesv2.CreateEmailIdentityOutput{}, nil)
		}},
		{name: "DeleteEmailIdentity", method: "DELETE", path: "/sesv2/email-identities/test@example.com", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().DeleteEmailIdentity(mock.Anything, mock.Anything).Return(&sesv2.DeleteEmailIdentityOutput{}, nil)
		}},
		{name: "SendEmail", method: "POST", path: "/sesv2/email/send", setupMock: func(mp *mockports.SESv2Port) {
			mp.EXPECT().SendEmail(mock.Anything, mock.Anything).Return(&sesv2.SendEmailOutput{}, nil)
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
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestSESv2_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/sesv2/email/send", []byte(`{bad`))
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

	w := performRequest(r, "GET", "/sesv2/email-identities", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestSESv2_ServiceErrors(t *testing.T) {
	t.Parallel()

	// Only include non-stub handlers that call the service port.
	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.SESv2Port)
	}{
		{
			name: "GetEmailIdentity", method: "GET", path: "/sesv2/email-identities/test@example.com",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().GetEmailIdentity(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateEmailIdentity", method: "POST", path: "/sesv2/email-identities",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().CreateEmailIdentity(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteEmailIdentity", method: "DELETE", path: "/sesv2/email-identities/test@example.com",
			setupMock: func(mp *mockports.SESv2Port) {
				mp.EXPECT().DeleteEmailIdentity(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "SendEmail", method: "POST", path: "/sesv2/email/send",
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
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestSESv2_ParseErrors(t *testing.T) {
	t.Parallel()

	// Only include non-stub handlers that parse the request body.
	// GetEmailIdentity and DeleteEmailIdentity use URL params only.
	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "ListEmailIdentities", method: "GET", path: "/sesv2/email-identities"},
		{name: "CreateEmailIdentity", method: "POST", path: "/sesv2/email-identities"},
		{name: "SendEmail", method: "POST", path: "/sesv2/email/send"},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "method=%s path=%s body=%s", tt.method, tt.path, w.Body.String())
		})
	}
}
