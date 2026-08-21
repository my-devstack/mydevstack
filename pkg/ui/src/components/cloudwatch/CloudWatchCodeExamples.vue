<script setup lang="ts">
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import CodeSnippet from '@/components/common/CodeSnippet.vue'

const settingsStore = useSettingsStore()

const snippets = computed(() => [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# === ALARMS ===

# List alarms
aws cloudwatch describe-alarms --endpoint-url ${settingsStore.publicEndpoint}

# Create alarm
aws cloudwatch put-metric-alarm \\
  --alarm-name "HighCPU" \\
  --alarm-description "CPU > 80%" \\
  --metric-name CPUUtilization \\
  --namespace AWS/EC2 \\
  --statistic Average \\
  --period 300 \\
  --evaluation-periods 2 \\
  --threshold 80 \\
  --comparison-operator GreaterThanThreshold \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Delete alarm
aws cloudwatch delete-alarms \\
  --alarm-names "HighCPU" \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Set alarm state manually (for testing)
aws cloudwatch set-alarm-state \\
  --alarm-name "HighCPU" \\
  --state-value ALARM \\
  --state-reason "Manual test" \\
  --endpoint-url ${settingsStore.publicEndpoint}

# === METRICS ===

# List metrics
aws cloudwatch list-metrics --namespace AWS/EC2 --endpoint-url ${settingsStore.publicEndpoint}

# Get metric statistics
aws cloudwatch get-metric-statistics \\
  --namespace AWS/EC2 \\
  --metric-name CPUUtilization \\
  --statistics Average \\
  --period 300 \\
  --start-time 2024-01-01T00:00:00Z \\
  --end-time 2024-01-02T00:00:00Z \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Put custom metric data
aws cloudwatch put-metric-data \\
  --namespace "MyApp" \\
  --metric-name ErrorCount \\
  --value 1 \\
  --unit Count \\
  --endpoint-url ${settingsStore.publicEndpoint}

# === LOGS ===

# List log groups
aws logs describe-log-groups --endpoint-url ${settingsStore.publicEndpoint}

# Create log group
aws logs create-log-group --log-group-name /myapp/demo --endpoint-url ${settingsStore.publicEndpoint}

# Set retention policy
aws logs put-retention-policy \\
  --log-group-name /myapp/demo \\
  --retention-in-days 30 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Create log stream
aws logs create-log-stream \\
  --log-group-name /myapp/demo \\
  --log-stream-name stream-1 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Put log events
TS=$(date +%s000)
aws logs put-log-events \\
  --log-group-name /myapp/demo \\
  --log-stream-name stream-1 \\
  --log-events timestamp=$TS,message='INFO: Server started' \\
                timestamp=$((TS+1000)),message='ERROR: DB timeout' \\
                timestamp=$((TS+2000)),message='WARN: Memory 90%' \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Get log events
aws logs get-log-events \\
  --log-group-name /myapp/demo \\
  --log-stream-name stream-1 \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Describe log streams
aws logs describe-log-streams \\
  --log-group-name /myapp/demo \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Delete log group
aws logs delete-log-group --log-group-name /myapp/demo --endpoint-url ${settingsStore.publicEndpoint}`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// === ALARMS ===

import { CloudWatchClient, DescribeAlarmsCommand, PutMetricAlarmCommand, DeleteAlarmsCommand, SetAlarmStateCommand } from "@aws-sdk/client-cloudwatch";

const cw = new CloudWatchClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
  credentials: { accessKeyId: '${settingsStore.accessKey}', secretAccessKey: '${settingsStore.secretKey}' },
});

// List alarms
const alarms = await cw.send(new DescribeAlarmsCommand({}));
console.log(alarms.MetricAlarms);

// Create alarm with TitleCase keys
await cw.send(new PutMetricAlarmCommand({
  AlarmName: 'HighCPU',
  MetricName: 'CPUUtilization',
  Namespace: 'AWS/EC2',
  Statistic: 'Average',
  Period: 300,
  EvaluationPeriods: 2,
  Threshold: 80,
  ComparisonOperator: 'GreaterThanThreshold',
}));

// Set alarm state
await cw.send(new SetAlarmStateCommand({
  AlarmName: 'HighCPU',
  StateValue: 'ALARM',
  StateReason: 'Testing',
}));

// Delete alarm
await cw.send(new DeleteAlarmsCommand({ AlarmNames: ['HighCPU'] }));

// === METRICS ===

import { ListMetricsCommand, GetMetricStatisticsCommand, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

// List metrics
const metrics = await cw.send(new ListMetricsCommand({ Namespace: 'AWS/EC2' }));
console.log(metrics.Metrics);

// Get metric statistics
const stats = await cw.send(new GetMetricStatisticsCommand({
  Namespace: 'AWS/EC2',
  MetricName: 'CPUUtilization',
  Statistics: ['Average'],
  Period: 300,
  StartTime: new Date('2024-01-01T00:00:00Z'),
  EndTime: new Date('2024-01-02T00:00:00Z'),
}));
console.log(stats.Datapoints);

// Put custom metric data
await cw.send(new PutMetricDataCommand({
  Namespace: 'MyApp',
  MetricData: [{ MetricName: 'ErrorCount', Value: 1, Unit: 'Count' }],
}));

// === LOGS ===

import { CloudWatchLogsClient, DescribeLogGroupsCommand, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand, DescribeLogStreamsCommand, GetLogEventsCommand, DeleteLogGroupCommand } from "@aws-sdk/client-cloudwatch-logs";

const logs = new CloudWatchLogsClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
  credentials: { accessKeyId: '${settingsStore.accessKey}', secretAccessKey: '${settingsStore.secretKey}' },
});

// List log groups
const groups = await logs.send(new DescribeLogGroupsCommand({}));
console.log(groups.logGroups);

// Create log group
await logs.send(new CreateLogGroupCommand({ logGroupName: '/myapp/demo' }));

// Create log stream
await logs.send(new CreateLogStreamCommand({
  logGroupName: '/myapp/demo',
  logStreamName: 'stream-1',
}));

// Put log events
await logs.send(new PutLogEventsCommand({
  logGroupName: '/myapp/demo',
  logStreamName: 'stream-1',
  logEvents: [
    { timestamp: Date.now(), message: 'INFO: Server started' },
    { timestamp: Date.now() + 1000, message: 'ERROR: DB timeout' },
  ],
}));

// Get log events
const events = await logs.send(new GetLogEventsCommand({
  logGroupName: '/myapp/demo',
  logStreamName: 'stream-1',
}));
console.log(events.events);

// Describe log streams
const streams = await logs.send(new DescribeLogStreamsCommand({
  logGroupName: '/myapp/demo',
}));
console.log(streams.logStreams);

// Delete log group
await logs.send(new DeleteLogGroupCommand({ logGroupName: '/myapp/demo' }));`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# === ALARMS ===

import boto3

cw = boto3.client('cloudwatch',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.publicEndpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}')

# List alarms
response = cw.describe_alarms()
for alarm in response['MetricAlarms']:
    print(alarm['AlarmName'])

# Create alarm
cw.put_metric_alarm(
    AlarmName='HighCPU',
    MetricName='CPUUtilization',
    Namespace='AWS/EC2',
    Statistic='Average',
    Period=300,
    EvaluationPeriods=2,
    Threshold=80.0,
    ComparisonOperator='GreaterThanThreshold')

# Set alarm state
cw.set_alarm_state(AlarmName='HighCPU', StateValue='ALARM', StateReason='Testing')

# Delete alarm
cw.delete_alarms(AlarmNames=['HighCPU'])

# === METRICS ===

# List metrics
response = cw.list_metrics(Namespace='AWS/EC2')
for m in response['Metrics']:
    print(m['MetricName'])

# Get metric statistics
from datetime import datetime, timedelta
response = cw.get_metric_statistics(
    Namespace='AWS/EC2', MetricName='CPUUtilization',
    Statistics=['Average'], Period=300,
    StartTime=datetime(2024, 1, 1), EndTime=datetime(2024, 1, 2))
for p in response['Datapoints']:
    print(p['Timestamp'], p['Average'])

# Put custom metric data
cw.put_metric_data(
    Namespace='MyApp',
    MetricData=[{'MetricName': 'ErrorCount', 'Value': 1, 'Unit': 'Count'}])

# === LOGS ===

logs = boto3.client('logs',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.publicEndpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}')

# List log groups
response = logs.describe_log_groups()
for g in response['logGroups']:
    print(g['logGroupName'])

# Create log group
logs.create_log_group(logGroupName='/myapp/demo')

# Set retention
logs.put_retention_policy(logGroupName='/myapp/demo', retentionInDays=30)

# Create log stream
logs.create_log_stream(logGroupName='/myapp/demo', logStreamName='stream-1')

# Put log events
import time
ts = int(time.time() * 1000)
logs.put_log_events(
    logGroupName='/myapp/demo',
    logStreamName='stream-1',
    logEvents=[
        {'timestamp': ts, 'message': 'INFO: Server started'},
        {'timestamp': ts + 1000, 'message': 'ERROR: DB timeout'},
    ])

# Get log events
response = logs.get_log_events(logGroupName='/myapp/demo', logStreamName='stream-1')
for e in response['events']:
    print(e['timestamp'], e['message'])

# Describe log streams
response = logs.describe_log_streams(logGroupName='/myapp/demo')
for s in response['logStreams']:
    print(s['logStreamName'])

# Delete log group
logs.delete_log_group(logGroupName='/myapp/demo')`,
  },
  {
    language: 'go',
    label: 'Go',
    code: `// === ALARMS ===

import (
    "context"
    "fmt"
    "time"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/cloudwatch"
    "github.com/aws/aws-sdk-go-v2/service/cloudwatch/types"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

cw := cloudwatch.NewFromConfig(cfg, func(o *cloudwatch.Options) {
    o.BaseEndpoint = aws.String("${settingsStore.publicEndpoint}")
})

// List alarms
alarms, _ := cw.DescribeAlarms(context.Background(), &cloudwatch.DescribeAlarmsInput{})
fmt.Println(alarms.MetricAlarms)

// Create alarm
_, _ = cw.PutMetricAlarm(context.Background(), &cloudwatch.PutMetricAlarmInput{
    AlarmName:          aws.String("HighCPU"),
    MetricName:         aws.String("CPUUtilization"),
    Namespace:          aws.String("AWS/EC2"),
    Statistic:          types.StatisticAverage,
    Period:             aws.Int32(300),
    EvaluationPeriods:  aws.Int32(2),
    Threshold:          aws.Float64(80),
    ComparisonOperator: types.ComparisonOperatorGreaterThanThreshold,
})

// Set alarm state
_, _ = cw.SetAlarmState(context.Background(), &cloudwatch.SetAlarmStateInput{
    AlarmName:   aws.String("HighCPU"),
    StateValue:  types.StateValueAlarm,
    StateReason: aws.String("Testing"),
})

// Delete alarm
_, _ = cw.DeleteAlarms(context.Background(), &cloudwatch.DeleteAlarmsInput{
    AlarmNames: []string{"HighCPU"},
})

// === METRICS ===

// List metrics
metrics, _ := cw.ListMetrics(context.Background(), &cloudwatch.ListMetricsInput{
    Namespace: aws.String("AWS/EC2"),
})
fmt.Println(metrics.Metrics)

// Get metric statistics
stats, _ := cw.GetMetricStatistics(context.Background(), &cloudwatch.GetMetricStatisticsInput{
    Namespace:  aws.String("AWS/EC2"),
    MetricName: aws.String("CPUUtilization"),
    Statistics: []types.Statistic{types.StatisticAverage},
    Period:     aws.Int32(300),
    StartTime:  aws.Time(time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)),
    EndTime:    aws.Time(time.Date(2024, 1, 2, 0, 0, 0, 0, time.UTC)),
})
fmt.Println(stats.Datapoints)

// Put custom metric data
_, _ = cw.PutMetricData(context.Background(), &cloudwatch.PutMetricDataInput{
    Namespace: aws.String("MyApp"),
    MetricData: []types.MetricDatum{{
        MetricName: aws.String("ErrorCount"),
        Value:      aws.Float64(1),
        Unit:       types.StandardUnitCount,
    }},
})

// === LOGS ===

import (
    "github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs"
    "github.com/aws/aws-sdk-go-v2/service/cloudwatchlogs/types"
)

logs := cloudwatchlogs.NewFromConfig(cfg, func(o *cloudwatchlogs.Options) {
    o.BaseEndpoint = aws.String("${settingsStore.publicEndpoint}")
})

// List log groups
groups, _ := logs.DescribeLogGroups(context.Background(), &cloudwatchlogs.DescribeLogGroupsInput{})
fmt.Println(groups.LogGroups)

// Create log group
_, _ = logs.CreateLogGroup(context.Background(), &cloudwatchlogs.CreateLogGroupInput{
    LogGroupName: aws.String("/myapp/demo"),
})

// Create log stream
_, _ = logs.CreateLogStream(context.Background(), &cloudwatchlogs.CreateLogStreamInput{
    LogGroupName:  aws.String("/myapp/demo"),
    LogStreamName: aws.String("stream-1"),
})

// Put log events
_, _ = logs.PutLogEvents(context.Background(), &cloudwatchlogs.PutLogEventsInput{
    LogGroupName:  aws.String("/myapp/demo"),
    LogStreamName: aws.String("stream-1"),
    LogEvents: []types.InputLogEvent{
        {Timestamp: aws.Int64(time.Now().UnixMilli()), Message: aws.String("INFO: Server started")},
        {Timestamp: aws.Int64(time.Now().UnixMilli() + 1000), Message: aws.String("ERROR: DB timeout")},
    },
})

// Get log events
events, _ := logs.GetLogEvents(context.Background(), &cloudwatchlogs.GetLogEventsInput{
    LogGroupName:  aws.String("/myapp/demo"),
    LogStreamName: aws.String("stream-1"),
})
fmt.Println(events.Events)

// Describe log streams
streams, _ := logs.DescribeLogStreams(context.Background(), &cloudwatchlogs.DescribeLogStreamsInput{
    LogGroupName: aws.String("/myapp/demo"),
})
fmt.Println(streams.LogStreams)

// Delete log group
_, _ = logs.DeleteLogGroup(context.Background(), &cloudwatchlogs.DeleteLogGroupInput{
    LogGroupName: aws.String("/myapp/demo"),
})`,
  },
])
</script>

<template>
  <CodeSnippet
    title="Usage Examples"
    :snippets="snippets"
    default-tab="aws-cli"
    :disable-highlight="true"
  />
</template>
