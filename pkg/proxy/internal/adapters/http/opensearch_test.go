package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/opensearch"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestOpenSearchActions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.OpenSearchPort)
	}{
		{name: "ListDomainNames", method: "GET", path: "/opensearch/domains", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().ListDomainNames(mock.Anything, mock.Anything).Return(&opensearch.ListDomainNamesOutput{}, nil)
		}},
		{name: "DescribeDomainConfig", method: "GET", path: "/opensearch/domains/testdomain/config", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().DescribeDomainConfig(mock.Anything, mock.Anything).Return(&opensearch.DescribeDomainConfigOutput{}, nil)
		}},
		{name: "DescribeDomain", method: "GET", path: "/opensearch/domains/testdomain", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().DescribeDomain(mock.Anything, mock.Anything).Return(&opensearch.DescribeDomainOutput{}, nil)
		}},
		{name: "CreateDomain", method: "POST", path: "/opensearch/domains", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().CreateDomain(mock.Anything, mock.Anything).Return(&opensearch.CreateDomainOutput{}, nil)
		}},
		{name: "DeleteDomain", method: "DELETE", path: "/opensearch/domains/testdomain", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().DeleteDomain(mock.Anything, mock.Anything).Return(&opensearch.DeleteDomainOutput{}, nil)
		}},
		{name: "UpdateDomainConfig", method: "PUT", path: "/opensearch/domains/testdomain/config", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().UpdateDomainConfig(mock.Anything, mock.Anything).Return(&opensearch.UpdateDomainConfigOutput{}, nil)
		}},
		{name: "ListTags", method: "GET", path: "/opensearch/tags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().ListTags(mock.Anything, mock.Anything).Return(&opensearch.ListTagsOutput{}, nil)
		}},
		{name: "AddTags", method: "POST", path: "/opensearch/tags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(&opensearch.AddTagsOutput{}, nil)
		}},
		{name: "TagResource", method: "POST", path: "/opensearch/tags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(&opensearch.AddTagsOutput{}, nil)
		}},
		{name: "RemoveTags", method: "DELETE", path: "/opensearch/tags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(&opensearch.RemoveTagsOutput{}, nil)
		}},
		{name: "UntagResource", method: "DELETE", path: "/opensearch/tags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(&opensearch.RemoveTagsOutput{}, nil)
		}},
		{name: "GetCompatibleVersions", method: "GET", path: "/opensearch/compatible-versions", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().GetCompatibleVersions(mock.Anything, mock.Anything).Return(&opensearch.GetCompatibleVersionsOutput{}, nil)
		}},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewOpenSearchPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().OpenSearch().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestOpenSearch_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/opensearch/domains", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestOpenSearch_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewOpenSearchPort(t)
	mp.EXPECT().ListDomainNames(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().OpenSearch().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/opensearch/domains", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestOpenSearch_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/opensearch/unknown", []byte("{}"))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestOpenSearch_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.OpenSearchPort)
	}{
		{
			name: "DescribeDomain", method: "GET", path: "/opensearch/domains/testdomain",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().DescribeDomain(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateDomain", method: "POST", path: "/opensearch/domains",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().CreateDomain(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteDomain", method: "DELETE", path: "/opensearch/domains/testdomain",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().DeleteDomain(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UpdateDomainConfig", method: "PUT", path: "/opensearch/domains/testdomain/config",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().UpdateDomainConfig(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeDomainConfig", method: "GET", path: "/opensearch/domains/testdomain/config",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().DescribeDomainConfig(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListTags", method: "GET", path: "/opensearch/tags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().ListTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "AddTags", method: "POST", path: "/opensearch/tags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "TagResource", method: "POST", path: "/opensearch/tags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "RemoveTags", method: "DELETE", path: "/opensearch/tags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UntagResource", method: "DELETE", path: "/opensearch/tags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetCompatibleVersions", method: "GET", path: "/opensearch/compatible-versions",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().GetCompatibleVersions(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewOpenSearchPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().OpenSearch().Return(mp)
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

func TestOpenSearch_ParseErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "ListDomainNames", method: "GET", path: "/opensearch/domains"},
		{name: "CreateDomain", method: "POST", path: "/opensearch/domains"},
		{name: "UpdateDomainConfig", method: "PUT", path: "/opensearch/domains/testdomain/config"},
		{name: "ListTags", method: "GET", path: "/opensearch/tags"},
		{name: "TagResource", method: "POST", path: "/opensearch/tags"},
		{name: "AddTags", method: "POST", path: "/opensearch/tags"},
		{name: "UntagResource", method: "DELETE", path: "/opensearch/tags"},
		{name: "RemoveTags", method: "DELETE", path: "/opensearch/tags"},
		{name: "GetCompatibleVersions", method: "GET", path: "/opensearch/compatible-versions"},
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
