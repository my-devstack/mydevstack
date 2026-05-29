package httphandlers

import (
	"errors"
	"net/http"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/cloudwatch"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func TestCloudWatchActions(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.CloudWatchPort)
	}{
		{name: "DescribeAlarms", method: "GET", path: "/cloudwatch/alarms", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().DescribeAlarms(mock.Anything, mock.Anything).Return(&cloudwatch.DescribeAlarmsOutput{}, nil)
		}},
		{name: "PutMetricAlarm", method: "POST", path: "/cloudwatch/alarms", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().PutMetricAlarm(mock.Anything, mock.Anything).Return(&cloudwatch.PutMetricAlarmOutput{}, nil)
		}},
		{name: "DeleteAlarms", method: "DELETE", path: "/cloudwatch/alarms/testalarm", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().DeleteAlarms(mock.Anything, mock.Anything).Return(&cloudwatch.DeleteAlarmsOutput{}, nil)
		}},
		{name: "SetAlarmState", method: "PUT", path: "/cloudwatch/alarms/testalarm", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().SetAlarmState(mock.Anything, mock.Anything).Return(&cloudwatch.SetAlarmStateOutput{}, nil)
		}},
		{name: "DescribeAlarmHistory", method: "GET", path: "/cloudwatch/alarms/testalarm/history", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().DescribeAlarmHistory(mock.Anything, mock.Anything).Return(&cloudwatch.DescribeAlarmHistoryOutput{}, nil)
		}},
		{name: "ListMetrics", method: "GET", path: "/cloudwatch/metrics", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().ListMetrics(mock.Anything, mock.Anything).Return(&cloudwatch.ListMetricsOutput{}, nil)
		}},
		{name: "GetMetricData", method: "POST", path: "/cloudwatch/metrics/data", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().GetMetricData(mock.Anything, mock.Anything).Return(&cloudwatch.GetMetricDataOutput{}, nil)
		}},
		{name: "GetMetricStatistics", method: "POST", path: "/cloudwatch/metrics/statistics", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().GetMetricStatistics(mock.Anything, mock.Anything).Return(&cloudwatch.GetMetricStatisticsOutput{}, nil)
		}},
		{name: "PutMetricData", method: "POST", path: "/cloudwatch/metrics", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().PutMetricData(mock.Anything, mock.Anything).Return(&cloudwatch.PutMetricDataOutput{}, nil)
		}},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewCloudWatchPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().CloudWatch().Return(mp)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, tt.method, tt.path, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestCloudWatch_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/cloudwatch/alarms", []byte(`{bad`))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestCloudWatch_ServiceError(t *testing.T) {
	t.Parallel()

	mp := mockports.NewCloudWatchPort(t)
	mp.EXPECT().DescribeAlarms(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
	svc := createMockSvc(t, nil)
	svc.EXPECT().CloudWatch().Return(mp)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/cloudwatch/alarms", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCloudWatch_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "GET", "/cloudwatch/unknown", []byte("{}"))
	assert.Equal(t, http.StatusNotFound, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestCloudWatch_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		method    string
		path      string
		setupMock func(mp *mockports.CloudWatchPort)
	}{
		{
			name: "PutMetricAlarm", method: "POST", path: "/cloudwatch/alarms",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().PutMetricAlarm(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteAlarms", method: "DELETE", path: "/cloudwatch/alarms/testalarm",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().DeleteAlarms(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "SetAlarmState", method: "PUT", path: "/cloudwatch/alarms/testalarm",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().SetAlarmState(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeAlarmHistory", method: "GET", path: "/cloudwatch/alarms/testalarm/history",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().DescribeAlarmHistory(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListMetrics", method: "GET", path: "/cloudwatch/metrics",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().ListMetrics(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetMetricData", method: "POST", path: "/cloudwatch/metrics/data",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().GetMetricData(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetMetricStatistics", method: "POST", path: "/cloudwatch/metrics/statistics",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().GetMetricStatistics(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutMetricData", method: "POST", path: "/cloudwatch/metrics",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().PutMetricData(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			mp := mockports.NewCloudWatchPort(t)
			tt.setupMock(mp)
			svc := createMockSvc(t, nil)
			svc.EXPECT().CloudWatch().Return(mp)
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

func TestCloudWatch_ParseErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name   string
		method string
		path   string
	}{
		{name: "DescribeAlarms", method: "GET", path: "/cloudwatch/alarms"},
		{name: "PutMetricAlarm", method: "POST", path: "/cloudwatch/alarms"},
		{name: "DeleteAlarms", method: "DELETE", path: "/cloudwatch/alarms/testalarm"},
		{name: "SetAlarmState", method: "PUT", path: "/cloudwatch/alarms/testalarm"},
		{name: "DescribeAlarmHistory", method: "GET", path: "/cloudwatch/alarms/testalarm/history"},
		{name: "ListMetrics", method: "GET", path: "/cloudwatch/metrics"},
		{name: "GetMetricData", method: "POST", path: "/cloudwatch/metrics/data"},
		{name: "GetMetricStatistics", method: "POST", path: "/cloudwatch/metrics/statistics"},
		{name: "PutMetricData", method: "POST", path: "/cloudwatch/metrics"},
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
