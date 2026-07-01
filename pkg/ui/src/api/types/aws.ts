// Common AWS Types
export interface AWSError {
  Error: {
    Code: string
    Message: string
  }
  RequestId: string
}

export interface AWSResponse<T> {
  ResponseMetadata?: {
    RequestId: string
    Metadata?: Record<string, string>
  }
}

export interface PaginationToken {
  NextToken?: string
  IsTruncated?: boolean
}

// S3 Types
export interface S3Bucket {
  Name: string
  CreationDate: string
  Region?: string
}

export interface S3Object {
  Key: string
  LastModified: string
  Size: number
  ETag: string
  StorageClass?: string
  Owner?: {
    DisplayName: string
    ID: string
  }
}

export interface S3ListBucketsResponse {
  ListAllMyBucketsResponse: {
    Owner: {
      DisplayName: string
      ID: string
    }
    Buckets: {
      Bucket: S3Bucket[]
    }
  }
}

export interface S3ListObjectsResponse {
  ListBucketResult: {
    Name: string
    Prefix?: string
    Marker?: string
    NextMarker?: string
    IsTruncated: boolean
    Contents?: S3Object[]
    CommonPrefixes?: { Prefix: string }[]
    Delimiter?: string
  }
}

export interface S3CreateBucketRequest {
  Bucket: string
  ACL?: 'private' | 'public-read' | 'public-read-write' | 'authenticated-read'
  CreateBucketConfiguration?: {
    LocationConstraint: string
  }
}

export interface S3PutObjectRequest {
  Bucket: string
  Key: string
  Body?: string | Blob
  ContentType?: string
  ACL?: string
  CacheControl?: string
  ContentDisposition?: string
  ContentEncoding?: string
  ContentLanguage?: string
  Expires?: string
  Metadata?: Record<string, string>
  Tagging?: string
  ServerSideEncryption?: 'AES256' | 'aws:kms'
  SSEKMSKeyId?: string
}

export interface S3CopyObjectRequest {
  CopySource: string
  Bucket: string
  Key: string
}

// Lambda Types
export interface LambdaFunction {
  FunctionName: string
  FunctionArn: string
  Runtime: string
  Role: string
  Handler: string
  CodeSize: number
  Description?: string
  Timeout: number
  MemorySize: number
  LastModified: string
  CodeSha256: string
  Version: string
  State?: string
  StateReason?: string
  LastUpdateStatus?: string
  Environment?: {
    Variables: Record<string, string>
  }
  TracingConfig?: {
    Mode: 'PassThrough' | 'Active'
  }
}

export interface LambdaListFunctionsResponse {
  Functions: LambdaFunction[]
  NextMarker?: string
}

export interface LambdaCreateFunctionRequest {
  FunctionName: string
  Runtime: string
  Role: string
  Handler: string
  Code: {
    ZipFile?: string
    S3Bucket?: string
    S3Key?: string
    S3ObjectVersion?: string
  }
  Description?: string
  Timeout?: number
  MemorySize?: number
  Publish?: boolean
  Environment?: {
    Variables: Record<string, string>
  }
  TracingConfig?: {
    Mode: 'PassThrough' | 'Active'
  }
  Layers?: string[]
}

export interface LambdaInvocation {
  Payload?: string
  StatusCode: number
  FunctionError?: string
  LogResult?: string
}

export interface LambdaEventSourceMapping {
  UUID: string
  EventSourceArn: string
  FunctionArn: string
  State: string
  StateTransitionReason: string
  StartingPosition: 'TRIM_HORIZON' | 'LATEST' | 'AT_TIMESTAMP'
  BatchSize: number
  MaximumBatchingWindowInSeconds?: number
  ParallelizationFactor?: number
  MaximumRecordAgeInSeconds?: number
  BisectBatchOnFunctionError?: boolean
  DestinationConfig?: {
    OnFailure: {
      Destination: string
    }
  }
}

// DynamoDB Types
export interface DynamoDBAttributeDefinition {
  AttributeName: string
  AttributeType: 'S' | 'N' | 'B'
}

export interface DynamoDBKeySchema {
  AttributeName: string
  KeyType: 'HASH' | 'RANGE'
}

export interface DynamoDBProvisionedThroughput {
  ReadCapacityUnits: number
  WriteCapacityUnits: number
}

export interface DynamoDBTable {
  TableName: string
  TableArn: string
  TableStatus: 'CREATING' | 'UPDATED' | 'DELETING' | 'ACTIVE'
  CreationDateTime: string
  KeySchema: DynamoDBKeySchema[]
  AttributeDefinitions: DynamoDBAttributeDefinition[]
  ProvisionedThroughput?: DynamoDBProvisionedThroughput
  BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
  ItemCount?: number
  TableSizeBytes?: number
  GlobalSecondaryIndexes?: DynamoDBGlobalSecondaryIndex[]
}

export interface DynamoDBGlobalSecondaryIndex {
  IndexName: string
  KeySchema: DynamoDBKeySchema[]
  Projection: {
    ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
    NonKeyAttributes?: string[]
  }
  IndexStatus: 'CREATING' | 'ACTIVE' | 'DELETING' | 'UPDATING'
  ProvisionedThroughput?: DynamoDBProvisionedThroughput
}

export interface DynamoDBStreamSpecification {
  StreamEnabled: boolean
  StreamViewType?: 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES'
}

export interface DynamoDBTTLDescription {
  TimeToLiveStatus: 'ENABLED' | 'DISABLED'
  AttributeName?: string
}

export interface DynamoDBListTablesResponse {
  TableNames: string[]
  LastEvaluatedTableName?: string
}

export interface DynamoDBItem {
  [key: string]: {
    S?: string
    N?: string
    B?: string
    BOOL?: boolean
    NULL?: boolean
    L?: unknown[]
    M?: Record<string, unknown>
    SS?: string[]
    NS?: string[]
    BS?: string[]
  }
}

export interface DynamoDBCreateTableRequest {
  TableName: string
  KeySchema: DynamoDBKeySchema[]
  AttributeDefinitions: DynamoDBAttributeDefinition[]
  ProvisionedThroughput?: DynamoDBProvisionedThroughput
  BillingMode?: 'PROVISIONED' | 'PAY_PER_REQUEST'
  GlobalSecondaryIndexes?: {
    IndexName: string
    KeySchema: DynamoDBKeySchema[]
    Projection: { ProjectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'; NonKeyAttributes?: string[] }
    ProvisionedThroughput?: DynamoDBProvisionedThroughput
  }[]
  StreamSpecification?: DynamoDBStreamSpecification
}

export interface DynamoDBQueryRequest {
  TableName: string
  KeyConditionExpression?: string
  ExpressionAttributeNames?: Record<string, string>
  ExpressionAttributeValues?: Record<string, unknown>
  FilterExpression?: string
  ProjectionExpression?: string
  Limit?: number
  ScanIndexForward?: boolean
  ExclusiveStartKey?: Record<string, unknown>
}

export interface DynamoDBScanRequest {
  TableName: string
  FilterExpression?: string
  ExpressionAttributeNames?: Record<string, string>
  ExpressionAttributeValues?: Record<string, unknown>
  ProjectionExpression?: string
  Limit?: number
  ExclusiveStartKey?: Record<string, unknown>
  TotalSegments?: number
  Segment?: number
}

export interface DynamoDBQueryResponse {
  Items: Record<string, unknown>[]
  Count: number
  ScannedCount: number
  LastEvaluatedKey?: Record<string, unknown>
}

export interface DynamoDBScanResponse {
  Items: Record<string, unknown>[]
  Count: number
  ScannedCount: number
  LastEvaluatedKey?: Record<string, unknown>
}

// SQS Types
export interface SQSQueue {
  QueueUrl: string
  QueueArn: string
  Attributes: {
    QueueArn: string
    ApproximateNumberOfMessages: string
    ApproximateNumberOfMessagesNotVisible: string
    ApproximateNumberOfMessagesDelayed: string
    CreatedTimestamp: string
    LastModifiedTimestamp: string
    VisibilityTimeout: string
    MaximumMessageSize: string
    MessageRetentionPeriod: string
    DelaySeconds: string
    ReceiveMessageWaitTimeSeconds: string
    FifoQueue?: string
    ContentBasedDeduplication?: string
  }
}

export interface SQSMessage {
  MessageId: string
  ReceiptHandle: string
  MD5OfBody: string
  Body: string
  Attributes?: Record<string, string>
  MessageAttributes?: Record<string, {
    Name: string
    Value: {
      StringValue?: string
      BinaryValue?: string
      StringListValues?: string[]
      BinaryListValues?: string[]
      DataType: string
    }
  }>
}

export interface SQSListQueuesResponse {
  QueueUrls: string[]
}

export interface SQSCreateQueueRequest {
  QueueName: string
  Attributes?: Record<string, string>
  tags?: Record<string, string>
}

export interface SQSReceiveMessageResponse {
  Messages: SQSMessage[]
}

// SNS Types
export interface SNSTopic {
  TopicArn: string
  TopicName: string
  DisplayName?: string
  Owner?: string
  Policies?: string
  Tags?: { Key: string; Value: string }[]
}

export interface SNSSubscription {
  SubscriptionArn: string
  Owner: string
  Protocol: string
  Endpoint?: string
  TopicArn: string
  ConfirmationWasAuthenticated?: boolean
}

export interface SNSListTopicsResponse {
  Topics: SNSTopic[]
}

export interface SNSPublishRequest {
  TopicArn?: string
  TargetArn?: string
  PhoneNumber?: string
  Subject?: string
  Message: string
  MessageStructure?: string
  MessageAttributes?: Record<string, {
    DataType: string
    StringValue?: string
    BinaryValue?: string
  }>
}

export interface SNSPublishResponse {
  MessageId: string
}

// IAM Types
export interface IAMUser {
  UserName: string
  UserId: string
  Arn: string
  Path: string
  CreateDate: string
  PasswordLastUsed?: string
  PermissionsBoundary?: {
    PermissionsBoundaryType: string
    PermissionsBoundaryArn: string
  }
  Tags?: { Key: string; Value: string }[]
}

export interface IAMRole {
  RoleName: string
  RoleId: string
  Arn: string
  Path: string
  CreateDate: string
  AssumeRolePolicyDocument?: string
  Description?: string
  MaxSessionDuration?: number
  PermissionsBoundary?: {
    PermissionsBoundaryType: string
    PermissionsBoundaryArn: string
  }
  Tags?: { Key: string; Value: string }[]
}

export interface IAMPolicy {
  PolicyName: string
  PolicyArn: string
  Path: string
  DefaultVersionId: string
  AttachmentCount: number
  PermissionsBoundaryUsageCount: number
  IsAttachable: boolean
  Description?: string
  CreateDate: string
  UpdateDate: string
}

export interface IAMGroup {
  Path: string
  GroupName: string
  GroupId: string
  Arn: string
  CreateDate: string
}

export interface IAMListUsersResponse {
  Users: IAMUser[]
  IsTruncated: boolean
  Marker?: string
}

export interface IAMListRolesResponse {
  Roles: IAMRole[]
  IsTruncated: boolean
  Marker?: string
}

// KMS Types
export interface KMSKey {
  KeyId: string
  Arn: string
  Description: string
  KeyUsage: 'SIGN_VERIFY' | 'ENCRYPT_DECRYPT'
  KeyState: 'Enabled' | 'Disabled' | 'PendingDeletion' | 'PendingImport' | 'Unavailable'
  CreationDate: number
  ValidTo?: number
  Origin: 'AWS_KMS' | 'EXTERNAL' | 'AWS_CLOUDHSM'
  KeyManager: 'CUSTOMER' | 'AWS'
  CustomerMasterKeySpec?: string
  EncryptionAlgorithms?: string[]
  SigningAlgorithms?: string[]
}

export interface KMSEncryptRequest {
  KeyId: string
  Plaintext: string
  EncryptionAlgorithm?: 'SYMMETRIC_DEFAULT' | 'RSAES_OAEP_SHA_1' | 'RSAES_OAEP_SHA_256'
  GrantTokens?: string[]
}

export interface KMSEncryptResponse {
  CiphertextBlob: string
  KeyId: string
  EncryptionAlgorithm: string
}

export interface KMSListKeysResponse {
  Keys: { KeyId: string; KeyArn: string }[]
  NextMarker?: string
  Truncated: boolean
}

// Secrets Manager Types
export interface SecretsManagerSecret {
  ARN: string
  Name: string
  Description?: string
  KmsKeyId?: string
  RotationEnabled?: boolean
  RotationLambdaARN?: string
  LastRotatedDate?: string
  LastChangedDate: string
  LastAccessedDate?: string
  Tags?: { Key: string; Value: string }[]
  SecretVersionsToStages?: Record<string, string[]>
  CreatedDate: number
}

export interface SecretsManagerGetSecretValueResponse {
  ARN: string
  Name: string
  VersionId: string
  SecretString?: string
  SecretBinary?: string
  VersionStages?: string[]
  CreatedDate: number
}

// EventBridge Types
export interface EventBridgeRule {
  Name: string
  Arn: string
  EventPattern?: string
  ScheduleExpression?: string
  State: 'ENABLED' | 'DISABLED'
  Description?: string
  RoleArn?: string
  ManagedBy?: string
  EventBusName?: string
  Target?: EventBridgeTarget[]
}

export interface EventBridgeTarget {
  Id: string
  Arn: string
  RoleArn?: string
  Input?: string
  InputPath?: string
  TargetResource?: string
}

export interface EventBridgeEventBus {
  Name: string
  Arn: string
  Policy?: string
  Description?: string
}

// CloudWatch Types
export interface CloudWatchMetricData {
  Id: string
  Label: string
  Timestamps: string[]
  Values: number[]
  StatusCode: 'Complete' | 'InternalError' | 'PartialData'
}

export interface CloudWatchLogGroup {
  logGroupName: string
  creationTime: number
  retentionInDays?: number
  metricFilterCount: number
  arn: string
  storedBytes: number
  class?: 'STANDARD' | 'INFREQUENT_ACCESS'
}

export interface CloudWatchLogStream {
  logStreamName: string
  creationTime: number
  firstEventTimestamp?: number
  lastEventTimestamp?: number
  lastIngestionTime: number
  uploadSequenceToken?: string
  arn: string
  storedBytes: number
}

export interface CWLogEvent {
  timestamp: number
  message: string
  ingestionTime: number
  eventId: string
}

export interface CWCreateLogGroupInput {
  logGroupName: string
  tags?: Record<string, string>
}

// Step Functions Types
export interface StepFunctionsStateMachine {
  name: string
  stateMachineArn: string
  type: 'STANDARD' | 'EXPRESS'
  creationDate: string
  status: 'ACTIVE' | 'DELETING'
  definition?: string
  roleArn: string
}

export interface StepFunctionsExecution {
  executionArn: string
  stateMachineArn: string
  name: string
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'TIMED_OUT' | 'ABORTED'
  startDate: string
  stopDate?: string
  input?: string
  output?: string
  error?: string
  cause?: string
}

// Cognito Types
export interface CognitoUserPool {
  Id: string
  Name: string
  LambdaConfig?: {
    PreSignUp?: string
    CustomMessage?: string
    PostConfirmation?: string
    PreAuthentication?: string
    PostAuthentication?: string
    DefineAuthChallenge?: string
    CreateAuthChallenge?: string
    VerifyAuthChallengeResponse?: string
  }
  Status?: 'Enabled' | 'Disabled'
  LastModifiedDate: string
  CreationDate: string
}

export interface CognitoUser {
  Username: string
  UserAttributes: { Name: string; Value: string }[]
  UserStatus: 'UNCONFIRMED' | 'CONFIRMED' | 'ARCHIVED' | 'COMPROMISED' | 'UNKNOWN' | 'RESET_REQUIRED' | 'FORCE_CHANGE_PASSWORD'
  UserCreateDate: string
  UserLastModifiedDate: string
  Enabled: boolean
}

export interface CognitoIdentityPool {
  IdentityPoolId: string
  IdentityPoolName: string
  AllowUnauthenticatedIdentities: boolean
  AllowClassicFlow: boolean
}

// API Gateway Types
export interface APIGatewayRestAPI {
  id: string
  name: string
  description?: string
  createdDate: string
  apiKeySource?: 'HEADER' | 'AUTHORIZER'
  endpointConfiguration?: {
    types: ('EDGE' | 'REGIONAL' | 'PRIVATE')[]
    vpcEndpointIds?: string[]
  }
  tags?: Record<string, string>
  binaryMediaTypes?: string[]
}

export interface APIGatewayResource {
  id: string
  parentId: string
  path: string
  pathPart: string
  resourceMethods: Record<string, unknown>
}

export interface APIGatewayMethod {
  httpMethod: string
  HttpMethod?: string
  authorizationType: string
  AuthorizationType?: string
  authorizerId?: string
  apiKeyRequired: boolean
  ApiKeyRequired?: boolean
  methodResponses: Record<string, unknown>[]
  uri?: string
  type?: string
  Uri?: string
  Type?: string
  integrationId?: string
}

// REST API Deployment
export interface APIGatewayDeployment {
  id: string
  description?: string
  createdDate: string
}

// REST API Stage
export interface APIGatewayStage {
  stageName: string
  deploymentId?: string
  description?: string
  cacheClusterEnabled?: boolean
  cacheClusterSize?: string
  tracerLevel?: string
  variables?: Record<string, string>
  tags?: Record<string, string>
}

// HTTP API v2 Stage
export interface APIGatewayV2Stage {
  StageName: string
  ApiId?: string
  StageVariables?: Record<string, string>
  Tags?: Record<string, string>
  AccessLogSettings?: {
    DestinationArn?: string
    Format?: string
  }
  DefaultRouteSettings?: {
    LoggingLevel?: string
    DataTraceEnabled?: boolean
    ThrottlingBurstLimit?: number
    ThrottlingRateLimit?: number
  }
  Description?: string
  AutoDeploy?: boolean
}

// Kinesis Types
export interface KinesisStream {
  StreamName: string
  StreamARN: string
  StreamStatus: 'CREATING' | 'DELETING' | 'ACTIVE' | 'UPDATING'
  Shards: KinesisShard[]
}

export interface KinesisShard {
  ShardId: string
  ParentShardId?: string
  AdjacentParentShardId?: string
  HashKeyRange: {
    StartingHashKey: string
    EndingHashKey: string
  }
  SequenceNumberRange: {
    StartingSequenceNumber: string
    EndingSequenceNumber?: string
  }
}

export interface KinesisRecord {
  SequenceNumber: string
  Data: string
  PartitionKey: string
  ApproximateArrivalTimestamp: string
  EncryptionType?: 'NONE' | 'KMS'
}

// CloudFormation Types
export interface CloudFormationStack {
  StackName: string
  StackId: string
  StackStatus: string
  StackStatusReason?: string
  Description?: string
  CreationTime: string
  LastUpdatedTime?: string
  DeletionTime?: string
  NotificationARNs?: string[]
  TimeoutInMinutes?: number
  Capabilities?: string[]
  Outputs?: CloudFormationOutput[]
  EnableTerminationProtection?: boolean
  Tags?: Array<{ Key: string; Value: string }>
  RoleARN?: string
  ParentId?: string
  RootId?: string
  DriftInformation?: {
    StackDriftStatus?: string
    LastCheckTimestamp?: string
  }
  StackResources?: CloudFormationStackResource[]
}

export interface CloudFormationOutput {
  OutputKey: string
  OutputValue: string
  Description?: string
  ExportName?: string
}

export interface CloudFormationStackResource {
  LogicalResourceId: string
  PhysicalResourceId?: string
  ResourceType: string
  ResourceStatus: string
  ResourceStatusReason?: string
  LastUpdatedTimestamp: string
}

// SSM Types
export interface SSMParameter {
  Name: string
  Type: 'String' | 'StringList' | 'SecureString'
  Value: string
  Version: number
  LastModifiedDate: string
  ARN?: string
  DataType?: string
}

export interface SSMParameterHistory {
  Name: string
  Type: 'String' | 'StringList' | 'SecureString'
  Value: string
  Version: number
  LastModifiedDate: string
  LastModifiedUser?: string
  Description?: string
  Labels?: string[]
}

// ElastiCache Types
export interface ElastiCacheCluster {
  CacheClusterId: string
  CacheClusterStatus: string
  Engine: string
  EngineVersion: string
  NumCacheNodes: number
  PreferredAvailabilityZone: string
  CacheNodeType: string
  AuthTokenEnabled?: boolean
  TransitEncryptionEnabled?: boolean
  AtRestEncryptionEnabled?: boolean
  CacheSecurityGroups?: string[]
  SecurityGroups?: { SecurityGroupId: string; Status: string }[]
  CacheParameterGroup?: {
    CacheParameterGroupName: string
    ParameterApplyStatus: string
  }
  CacheSubnetGroupName?: string
  AutoMinorVersionUpgrade?: boolean
  ReplicationGroupId?: string
}

// RDS Types
export interface RDSDBInstance {
  DBInstanceIdentifier: string
  DBInstanceClass: string
  Engine: string
  DBInstanceStatus: string
  MasterUsername: string
  Endpoint?: {
    Address: string
    Port: number
    HostedZoneId: string
  }
  AllocatedStorage: number
  InstanceCreateTime?: string
  PreferredBackupWindow: string
  BackupRetentionPeriod: number
  DBSecurityGroups?: string[]
  VpcSecurityGroups?: { VpcSecurityGroupId: string; Status: string }[]
  DBParameterGroups?: {
    DBParameterGroupName: string
    ParameterApplyStatus: string
  }[]
  DBSubnetGroup?: {
    DBSubnetGroupName: string
    DBSubnetGroupDescription: string
    VpcId: string
    SubnetGroupStatus: string
  }
  PreferredMaintenanceWindow: string
  PendingModifiedValues?: {
    DBInstanceClass?: string
    AllocatedStorage?: number
    MasterUserPassword?: string
    Port?: number
  }
  LatestRestorableTime?: string
  MultiAZ: boolean
  AutoMinorVersionUpgrade: boolean
  EngineVersion: string
  PubliclyAccessible: boolean
  StorageType: string
  StorageEncrypted: boolean
  KmsKeyId?: string
  DbiResourceId: string
  CACertificateIdentifier: string
  DomainMemberships?: {
    Domain: string
    Status: string
    FQDN: string
    IAMRoleName: string
  }[]
}

// RDS Instance (simplified for frontend)
export interface RDSInstance {
  DBInstanceIdentifier: string
  DBInstanceClass: string
  Engine: string
  EngineVersion: string
  DBInstanceStatus: string
  MasterUsername: string
  Endpoint?: {
    Address: string
    Port: number
  }
  DBName?: string
  AllocatedStorage: number
  StorageType: string
  InstanceCreateTime?: string
  AvailabilityZone?: string
  MultiAZ: boolean
  PubliclyAccessible: boolean
}

// Create DB Instance Input
export interface CreateDBInstanceInput {
  DBInstanceIdentifier: string
  DBInstanceClass: string
  Engine: string
  EngineVersion?: string
  MasterUsername: string
  MasterUserPassword: string
  DBName?: string
  Port?: number
  AllocatedStorage?: number
  StorageType?: string
  MultiAZ?: boolean
  PubliclyAccessible?: boolean
}

// Describe DB Engine Versions Output
export interface DescribeDBEngineVersionsOutput {
  EngineVersions?: {
    Engine: string
    EngineVersion: string
    DBEngineVersionDescription?: string
  }[]
}

// CloudWatch Alarm Types
export interface CWAlarm {
  AlarmName: string
  AlarmArn: string
  AlarmDescription?: string
  AlarmConfigurationUpdatedTimestamp?: string
  StateValue: 'OK' | 'ALARM' | 'INSUFFICIENT_DATA'
  StateReason?: string
  StateUpdatedTimestamp?: string
  MetricName?: string
  Namespace?: string
  Period?: number
  EvaluationPeriods?: number
  Threshold?: number
  ComparisonOperator?: string
  Statistic?: string
  ActionsEnabled?: boolean
  AlarmActions?: string[]
  OKActions?: string[]
  InsufficientDataActions?: string[]
  Dimensions?: { Name: string; Value: string }[]
  Tags?: { Key: string; Value: string }[]
}

export interface CWAlarmHistoryItem {
  AlarmName: string
  AlarmType?: string
  Timestamp: string
  HistoryItemType: 'ConfigurationUpdate' | 'StateUpdate' | 'Action'
  HistorySummary: string
  HistoryData?: string
}

export interface CWMetric {
  MetricName: string
  Namespace: string
  Dimensions?: { Name: string; Value: string }[]
}

export interface CWMetricStat {
  Statistic: 'SampleCount' | 'Average' | 'Sum' | 'Minimum' | 'Maximum'
  Period: number
  Unit?: string
}

export interface CWMetricDataResult {
  Id: string
  Label?: string
  Timestamps?: string[]
  Values?: number[]
  StatusCode: 'Complete' | 'InternalError' | 'PartialData'
  Messages?: { Code: string; Value: string }[]
}

export interface CWPutMetricAlarmInput {
  AlarmName: string
  AlarmDescription?: string
  MetricName: string
  Namespace: string
  Period: number
  EvaluationPeriods: number
  Threshold: number
  ComparisonOperator: string
  Statistic?: string
  ActionsEnabled?: boolean
  AlarmActions?: string[]
  OKActions?: string[]
  InsufficientDataActions?: string[]
  Dimensions?: { Name: string; Value: string }[]
}

// SES Types
export interface SESIdentity {
  IdentityName: string
  IdentityType: 'EMAIL_ADDRESS' | 'DOMAIN'
  SendingEnabled: boolean
  VerifiedStatus: string
  VerificationStatus?: string
  CustomMailFrom?: { Status: string; MailFromDomain?: string }
  Tags?: { Key: string; Value: string }[]
}

export interface SESSendEmailRequest {
  FromEmailAddress?: string
  Destination: { ToAddresses: string[]; CcAddresses?: string[]; BccAddresses?: string[] }
  Content: { Simple: { Subject: { Data: string }; Body: { Text?: { Data: string }; Html?: { Data: string } } } }
  ReplyToAddresses?: string[]
}

export interface SESTemplate {
  TemplateName: string
  TemplateContent?: { Subject: string; Html?: string; Text?: string }
  CreatedTimestamp?: string
}

// EC2 Types
export interface EC2Instance {
  InstanceId: string
  ImageId: string
  InstanceType: string
  KeyName?: string
  State?: { Name: string; Code: number }
  LaunchTime?: string
  Placement?: { AvailabilityZone: string }
  SecurityGroups?: Array<{ GroupId: string; GroupName: string }>
  SubnetId?: string
  VpcId?: string
  Tags?: Array<{ Key: string; Value: string }>
  PublicIpAddress?: string
  PrivateIpAddress?: string
}

export interface EC2KeyPair {
  KeyName: string
  KeyFingerprint: string
  KeyPairId?: string
  KeyType?: string
}

export interface EC2SecurityGroup {
  GroupId: string
  GroupName: string
  Description: string
  VpcId: string
  IpPermissions?: Array<{
    IpProtocol: string
    FromPort?: number
    ToPort?: number
    IpRanges?: Array<{ CidrIp: string; Description?: string }>
  }>
  Tags?: Array<{ Key: string; Value: string }>
}

export interface EC2Vpc {
  VpcId: string
  CidrBlock: string
  IsDefault: boolean
  State: string
  Tags?: Array<{ Key: string; Value: string }>
}

export interface EC2Subnet {
  SubnetId: string
  VpcId: string
  CidrBlock: string
  AvailabilityZone: string
  State: string
  Tags?: Array<{ Key: string; Value: string }>
}
