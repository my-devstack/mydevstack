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
		target    string
		setupMock func(mp *mockports.OpenSearchPort)
	}{
		{name: "ListDomainNames", target: "ListDomainNames", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().ListDomainNames(mock.Anything, mock.Anything).Return(&opensearch.ListDomainNamesOutput{}, nil)
		}},
		{name: "DescribeDomainConfig", target: "DescribeDomainConfig", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().DescribeDomainConfig(mock.Anything, mock.Anything).Return(&opensearch.DescribeDomainConfigOutput{}, nil)
		}},
		{name: "DescribeDomain", target: "DescribeDomain", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().DescribeDomain(mock.Anything, mock.Anything).Return(&opensearch.DescribeDomainOutput{}, nil)
		}},
		{name: "CreateDomain", target: "CreateDomain", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().CreateDomain(mock.Anything, mock.Anything).Return(&opensearch.CreateDomainOutput{}, nil)
		}},
		{name: "DeleteDomain", target: "DeleteDomain", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().DeleteDomain(mock.Anything, mock.Anything).Return(&opensearch.DeleteDomainOutput{}, nil)
		}},
		{name: "UpdateDomainConfig", target: "UpdateDomainConfig", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().UpdateDomainConfig(mock.Anything, mock.Anything).Return(&opensearch.UpdateDomainConfigOutput{}, nil)
		}},
		{name: "ListTags", target: "ListTags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().ListTags(mock.Anything, mock.Anything).Return(&opensearch.ListTagsOutput{}, nil)
		}},
		{name: "AddTags", target: "AddTags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(&opensearch.AddTagsOutput{}, nil)
		}},
		{name: "TagResource", target: "TagResource", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(&opensearch.AddTagsOutput{}, nil)
		}},
		{name: "RemoveTags", target: "RemoveTags", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(&opensearch.RemoveTagsOutput{}, nil)
		}},
		{name: "UntagResource", target: "UntagResource", setupMock: func(mp *mockports.OpenSearchPort) {
			mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(&opensearch.RemoveTagsOutput{}, nil)
		}},
		{name: "GetCompatibleVersions", target: "GetCompatibleVersions", setupMock: func(mp *mockports.OpenSearchPort) {
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
			w := performRequest(r, "POST", "/opensearch/", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestOpenSearch_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	// OpenSearch not expected to be called since parseBody fails first.
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/opensearch/", "ListDomainNames", []byte(`{bad`))
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

	w := performRequest(r, "POST", "/opensearch/", "ListDomainNames", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestOpenSearch_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	// OpenSearch not expected to be called since unknown action returns before dispatch.
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/opensearch/", "UnknownAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestOpenSearch_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.OpenSearchPort)
	}{
		{
			name: "DescribeDomain", target: "DescribeDomain",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().DescribeDomain(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateDomain", target: "CreateDomain",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().CreateDomain(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteDomain", target: "DeleteDomain",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().DeleteDomain(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UpdateDomainConfig", target: "UpdateDomainConfig",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().UpdateDomainConfig(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeDomainConfig", target: "DescribeDomainConfig",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().DescribeDomainConfig(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListTags", target: "ListTags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().ListTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "AddTags", target: "AddTags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "TagResource", target: "TagResource",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().AddTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "RemoveTags", target: "RemoveTags",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "UntagResource", target: "UntagResource",
			setupMock: func(mp *mockports.OpenSearchPort) {
				mp.EXPECT().RemoveTags(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetCompatibleVersions", target: "GetCompatibleVersions",
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
			w := performRequest(r, "POST", "/opensearch/", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestOpenSearch_ParseErrors(t *testing.T) {
	t.Parallel()

	targets := []string{
		"ListDomainNames", "DescribeDomainConfig", "DescribeDomain",
		"CreateDomain", "DeleteDomain", "UpdateDomainConfig",
		"ListTags", "TagResource", "AddTags", "UntagResource", "RemoveTags",
		"GetCompatibleVersions",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/opensearch/", target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
		})
	}
}
