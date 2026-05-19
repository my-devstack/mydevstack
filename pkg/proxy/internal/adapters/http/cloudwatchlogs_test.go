package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCloudWatchLogsActions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.CloudWatchLogsPort)
	}{
		{name: "DescribeLogGroups", target: "DescribeLogGroups", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DescribeLogGroups(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeLogGroupsOutput{}, nil)
		}},
		{name: "CreateLogGroup", target: "CreateLogGroup", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().CreateLogGroup(mock.Anything, mock.Anything).Return(&cloudwatchlogs.CreateLogGroupOutput{}, nil)
		}},
		{name: "DeleteLogGroup", target: "DeleteLogGroup", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DeleteLogGroup(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DeleteLogGroupOutput{}, nil)
		}},
		{name: "DescribeLogStreams", target: "DescribeLogStreams", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DescribeLogStreams(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeLogStreamsOutput{}, nil)
		}},
		{name: "CreateLogStream", target: "CreateLogStream", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().CreateLogStream(mock.Anything, mock.Anything).Return(&cloudwatchlogs.CreateLogStreamOutput{}, nil)
		}},
		{name: "PutLogEvents", target: "PutLogEvents", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().PutLogEvents(mock.Anything, mock.Anything).Return(&cloudwatchlogs.PutLogEventsOutput{}, nil)
		}},
		{name: "GetLogEvents", target: "GetLogEvents", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().GetLogEvents(mock.Anything, mock.Anything).Return(&cloudwatchlogs.GetLogEventsOutput{}, nil)
		}},
		{name: "PutMetricFilter", target: "PutMetricFilter", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().PutMetricFilter(mock.Anything, mock.Anything).Return(&cloudwatchlogs.PutMetricFilterOutput{}, nil)
		}},
		{name: "DescribeMetricFilters", target: "DescribeMetricFilters", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DescribeMetricFilters(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeMetricFiltersOutput{}, nil)
		}},
		{name: "PutRetentionPolicy", target: "PutRetentionPolicy", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().PutRetentionPolicy(mock.Anything, mock.Anything).Return(&cloudwatchlogs.PutRetentionPolicyOutput{}, nil)
		}},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewCloudWatchLogsPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().CloudWatchLogs().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/cloudwatchlogs/", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestCloudWatchLogs_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/cloudwatchlogs/", "DescribeLogGroups", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCloudWatchLogs_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewCloudWatchLogsPort(t)
	mp.EXPECT().DescribeLogGroups(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().CloudWatchLogs().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/cloudwatchlogs/", "DescribeLogGroups", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCloudWatchLogs_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/cloudwatchlogs/", "UnknownCWLogsAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestCloudWatchLogs_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.CloudWatchLogsPort)
	}{
		{
			name: "CreateLogGroup", target: "CreateLogGroup",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().CreateLogGroup(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteLogGroup", target: "DeleteLogGroup",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().DeleteLogGroup(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeLogStreams", target: "DescribeLogStreams",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().DescribeLogStreams(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateLogStream", target: "CreateLogStream",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().CreateLogStream(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutLogEvents", target: "PutLogEvents",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().PutLogEvents(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetLogEvents", target: "GetLogEvents",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().GetLogEvents(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutMetricFilter", target: "PutMetricFilter",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().PutMetricFilter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeMetricFilters", target: "DescribeMetricFilters",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().DescribeMetricFilters(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutRetentionPolicy", target: "PutRetentionPolicy",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().PutRetentionPolicy(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewCloudWatchLogsPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().CloudWatchLogs().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/cloudwatchlogs/", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestCloudWatchLogs_ParseErrors(t *testing.T) {
	t.Parallel()

	targets := []string{
		"DescribeLogGroups", "CreateLogGroup", "DeleteLogGroup",
		"DescribeLogStreams", "CreateLogStream", "PutLogEvents", "GetLogEvents",
		"PutMetricFilter", "DescribeMetricFilters", "PutRetentionPolicy",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/cloudwatchlogs/", target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
		})
	}
}
