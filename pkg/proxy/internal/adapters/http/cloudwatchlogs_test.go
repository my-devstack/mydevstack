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
		method    string
		path      string
		setupMock func(mp *mockports.CloudWatchLogsPort)
	}{
		{name: "DescribeLogGroups", method: "GET", path: "/cloudwatch-logs/log-groups", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DescribeLogGroups(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeLogGroupsOutput{}, nil)
		}},
		{name: "CreateLogGroup", method: "POST", path: "/cloudwatch-logs/log-groups", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().CreateLogGroup(mock.Anything, mock.Anything).Return(&cloudwatchlogs.CreateLogGroupOutput{}, nil)
		}},
		{name: "DeleteLogGroup", method: "DELETE", path: "/cloudwatch-logs/log-groups/testgroup", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DeleteLogGroup(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DeleteLogGroupOutput{}, nil)
		}},
		{name: "DescribeLogStreams", method: "GET", path: "/cloudwatch-logs/log-groups/testgroup/log-streams", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DescribeLogStreams(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeLogStreamsOutput{}, nil)
		}},
		{name: "CreateLogStream", method: "POST", path: "/cloudwatch-logs/log-groups/testgroup/log-streams", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().CreateLogStream(mock.Anything, mock.Anything).Return(&cloudwatchlogs.CreateLogStreamOutput{}, nil)
		}},
		{name: "PutLogEvents", method: "POST", path: "/cloudwatch-logs/log-groups/testgroup/log-streams/teststream/events", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().PutLogEvents(mock.Anything, mock.Anything).Return(&cloudwatchlogs.PutLogEventsOutput{}, nil)
		}},
		{name: "GetLogEvents", method: "GET", path: "/cloudwatch-logs/log-groups/testgroup/log-streams/teststream/events", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().GetLogEvents(mock.Anything, mock.Anything).Return(&cloudwatchlogs.GetLogEventsOutput{}, nil)
		}},
		{name: "PutMetricFilter", method: "POST", path: "/cloudwatch-logs/metric-filters", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().PutMetricFilter(mock.Anything, mock.Anything).Return(&cloudwatchlogs.PutMetricFilterOutput{}, nil)
		}},
		{name: "DescribeMetricFilters", method: "GET", path: "/cloudwatch-logs/metric-filters", setupMock: func(mp *mockports.CloudWatchLogsPort) {
			mp.EXPECT().DescribeMetricFilters(mock.Anything, mock.Anything).Return(&cloudwatchlogs.DescribeMetricFiltersOutput{}, nil)
		}},
		{name: "PutRetentionPolicy", method: "PUT", path: "/cloudwatch-logs/log-groups/testgroup/retention", setupMock: func(mp *mockports.CloudWatchLogsPort) {
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
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestCloudWatchLogs_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/cloudwatch-logs/log-groups", []byte(`{bad`))
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

	w := performRequest(r, "GET", "/cloudwatch-logs/log-groups", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCloudWatchLogs_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/cloudwatch-logs/unknown", []byte("{}"))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestCloudWatchLogs_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.CloudWatchLogsPort)
	}{
		{
			name: "CreateLogGroup", method: "POST", path: "/cloudwatch-logs/log-groups",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().CreateLogGroup(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteLogGroup", method: "DELETE", path: "/cloudwatch-logs/log-groups/testgroup",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().DeleteLogGroup(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeLogStreams", method: "GET", path: "/cloudwatch-logs/log-groups/testgroup/log-streams",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().DescribeLogStreams(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "CreateLogStream", method: "POST", path: "/cloudwatch-logs/log-groups/testgroup/log-streams",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().CreateLogStream(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutLogEvents", method: "POST", path: "/cloudwatch-logs/log-groups/testgroup/log-streams/teststream/events",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().PutLogEvents(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetLogEvents", method: "GET", path: "/cloudwatch-logs/log-groups/testgroup/log-streams/teststream/events",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().GetLogEvents(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutMetricFilter", method: "POST", path: "/cloudwatch-logs/metric-filters",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().PutMetricFilter(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeMetricFilters", method: "GET", path: "/cloudwatch-logs/metric-filters",
			setupMock: func(mp *mockports.CloudWatchLogsPort) {
				mp.EXPECT().DescribeMetricFilters(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutRetentionPolicy", method: "PUT", path: "/cloudwatch-logs/log-groups/testgroup/retention",
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
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestCloudWatchLogs_ParseErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "DescribeLogGroups", method: "GET", path: "/cloudwatch-logs/log-groups"},
		{name: "CreateLogGroup", method: "POST", path: "/cloudwatch-logs/log-groups"},
		{name: "DescribeLogStreams", method: "GET", path: "/cloudwatch-logs/log-groups/testgroup/log-streams"},
		{name: "CreateLogStream", method: "POST", path: "/cloudwatch-logs/log-groups/testgroup/log-streams"},
		{name: "PutLogEvents", method: "POST", path: "/cloudwatch-logs/log-groups/testgroup/log-streams/teststream/events"},
		{name: "GetLogEvents", method: "GET", path: "/cloudwatch-logs/log-groups/testgroup/log-streams/teststream/events"},
		{name: "PutMetricFilter", method: "POST", path: "/cloudwatch-logs/metric-filters"},
		{name: "DescribeMetricFilters", method: "GET", path: "/cloudwatch-logs/metric-filters"},
		{name: "PutRetentionPolicy", method: "PUT", path: "/cloudwatch-logs/log-groups/testgroup/retention"},
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
