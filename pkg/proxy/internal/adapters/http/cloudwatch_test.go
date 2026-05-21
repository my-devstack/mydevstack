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
		target    string
		setupMock func(mp *mockports.CloudWatchPort)
	}{
		{name: "DescribeAlarms", target: "DescribeAlarms", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().DescribeAlarms(mock.Anything, mock.Anything).Return(&cloudwatch.DescribeAlarmsOutput{}, nil)
		}},
		{name: "PutMetricAlarm", target: "PutMetricAlarm", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().PutMetricAlarm(mock.Anything, mock.Anything).Return(&cloudwatch.PutMetricAlarmOutput{}, nil)
		}},
		{name: "DeleteAlarms", target: "DeleteAlarms", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().DeleteAlarms(mock.Anything, mock.Anything).Return(&cloudwatch.DeleteAlarmsOutput{}, nil)
		}},
		{name: "SetAlarmState", target: "SetAlarmState", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().SetAlarmState(mock.Anything, mock.Anything).Return(&cloudwatch.SetAlarmStateOutput{}, nil)
		}},
		{name: "DescribeAlarmHistory", target: "DescribeAlarmHistory", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().DescribeAlarmHistory(mock.Anything, mock.Anything).Return(&cloudwatch.DescribeAlarmHistoryOutput{}, nil)
		}},
		{name: "ListMetrics", target: "ListMetrics", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().ListMetrics(mock.Anything, mock.Anything).Return(&cloudwatch.ListMetricsOutput{}, nil)
		}},
		{name: "GetMetricData", target: "GetMetricData", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().GetMetricData(mock.Anything, mock.Anything).Return(&cloudwatch.GetMetricDataOutput{}, nil)
		}},
		{name: "GetMetricStatistics", target: "GetMetricStatistics", setupMock: func(mp *mockports.CloudWatchPort) {
			mp.EXPECT().GetMetricStatistics(mock.Anything, mock.Anything).Return(&cloudwatch.GetMetricStatisticsOutput{}, nil)
		}},
		{name: "PutMetricData", target: "PutMetricData", setupMock: func(mp *mockports.CloudWatchPort) {
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
			w := performRequest(r, "POST", "/cloudwatch", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusOK, w.Code, "body=%s", w.Body.String())
		})
	}
}

func TestCloudWatch_InvalidBody(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/cloudwatch", "DescribeAlarms", []byte(`{bad`))
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

	w := performRequest(r, "POST", "/cloudwatch", "DescribeAlarms", []byte("{}"))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCloudWatch_UnknownAction(t *testing.T) {
	t.Parallel()

	svc := createMockSvc(t, nil)
	handler := createHandler(svc, createTestVersionService(t))
	r := setupTestRouter(handler)

	w := performRequest(r, "POST", "/cloudwatch", "UnknownCloudWatchAction", []byte("{}"))
	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ---------------------------------------------------------------------------
// Per-action service error tests
// ---------------------------------------------------------------------------

func TestCloudWatch_ServiceErrors(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name      string
		target    string
		setupMock func(mp *mockports.CloudWatchPort)
	}{
		{
			name: "PutMetricAlarm", target: "PutMetricAlarm",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().PutMetricAlarm(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DeleteAlarms", target: "DeleteAlarms",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().DeleteAlarms(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "SetAlarmState", target: "SetAlarmState",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().SetAlarmState(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "DescribeAlarmHistory", target: "DescribeAlarmHistory",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().DescribeAlarmHistory(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "ListMetrics", target: "ListMetrics",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().ListMetrics(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetMetricData", target: "GetMetricData",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().GetMetricData(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "GetMetricStatistics", target: "GetMetricStatistics",
			setupMock: func(mp *mockports.CloudWatchPort) {
				mp.EXPECT().GetMetricStatistics(mock.Anything, mock.Anything).Return(nil, errors.New("service error"))
			},
		},
		{
			name: "PutMetricData", target: "PutMetricData",
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
			w := performRequest(r, "POST", "/cloudwatch", tt.target, []byte("{}"))
			assert.Equal(t, http.StatusInternalServerError, w.Code, "body=%s", w.Body.String())
		})
	}
}

// ---------------------------------------------------------------------------
// Per-action parse error tests
// ---------------------------------------------------------------------------

func TestCloudWatch_ParseErrors(t *testing.T) {
	t.Parallel()

	targets := []string{
		"DescribeAlarms", "PutMetricAlarm", "DeleteAlarms", "SetAlarmState",
		"DescribeAlarmHistory", "ListMetrics", "GetMetricData", "GetMetricStatistics", "PutMetricData",
	}

	for _, target := range targets {
		target := target
		t.Run(target, func(t *testing.T) {
			t.Parallel()
			svc := createMockSvc(t, nil)
			handler := createHandler(svc, createTestVersionService(t))
			r := setupTestRouter(handler)
			w := performRequest(r, "POST", "/cloudwatch", target, []byte(`{bad`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "target=%s body=%s", target, w.Body.String())
		})
	}
}
