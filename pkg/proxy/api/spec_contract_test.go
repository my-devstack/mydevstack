package api

import (
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"testing"

	"gopkg.in/yaml.v3"
)

// specParam is a query/path parameter in the OpenAPI spec.
type specParam struct {
	Name string `yaml:"name"`
	In   string `yaml:"in"`
}

// specOp is a single HTTP method operation.
type specOp struct {
	OperationID string      `yaml:"operationId"`
	Summary     string      `yaml:"summary"`
	Deprecated  bool        `yaml:"deprecated"`
	XRead       interface{} `yaml:"x-read-operation"`
	Parameters  []specParam `yaml:"parameters"`
}

// specMethods maps HTTP method → operation.
type specMethods map[string]*specOp

// specPaths maps path → methods.
type specPaths map[string]specMethods

// specRoot is the top-level OpenAPI document.
type specRoot struct {
	Paths specPaths `yaml:"paths"`
}

// loadSpec reads openapi.yaml from the same directory as this test file.
func loadSpec(t *testing.T) specRoot {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot determine test file location")
	}
	p := filepath.Join(filepath.Dir(file), "openapi.yaml")
	b, err := os.ReadFile(p)
	if err != nil {
		t.Fatalf("read openapi.yaml: %v", err)
	}
	var root specRoot
	if err := yaml.Unmarshal(b, &root); err != nil {
		t.Fatalf("parse openapi.yaml: %v", err)
	}
	if len(root.Paths) == 0 {
		t.Fatal("openapi.yaml has no paths")
	}
	return root
}

// queryParamNames returns sorted query param names for an operation.
func queryParamNames(op *specOp) []string {
	var names []string
	for _, p := range op.Parameters {
		if p.In == "query" {
			names = append(names, p.Name)
		}
	}
	sort.Strings(names)
	return names
}

// stringSetEqual checks if two sorted string slices are identical.
func stringSetEqual(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

// getExpectations defines the 12 GET read-operation paths and their expected query params.
// The param lists must match exactly (case-sensitive, query params only).
var getExpectations = map[string][]string{
	"/dynamodb-streams/streams/{streamArn}/shards/{shardId}/iterator": {"shardIteratorType", "startingSequenceNumber", "startingTimestamp"},
	"/dynamodb-streams/streams/{streamArn}/shards/{shardId}/records":  {"limit", "shardIterator"},
	"/ecr/images/batch-get/{repositoryName}":                          {"acceptedMediaTypes", "imageDigests", "imageTags"},
	"/cloudwatch/metrics/statistics":                                  {"dimensions", "endTime", "metricName", "namespace", "period", "startTime", "statistics", "unit"},
	"/cloudwatch/metrics/data":                                        {"params"},
	"/apigateway/rest-apis/{restApiId}/invoke-url":                    {"apiId", "stage"},
	"/apigateway/apis/{apiId}/invoke-url":                             {"protocolType", "stage"},
	"/ssm/parameters":                                                 {"names", "withDecryption"},
	"/ssm/tags":                                                       {"resourceId", "resourceType"},
	"/iam/policies":                                                   {"policyArn"},
	"/kinesis/streams/{streamName}/shards/{shardId}/iterator":         {"shardIteratorType", "startingSequenceNumber", "startingTimestamp"},
	"/secrets-manager/random-password":                                {"excludeCharacters", "excludeLowercase", "excludeNumbers", "excludePunctuation", "excludeUppercase", "includeSpace", "passwordLength", "requireEachIncludedType"},
}

// TestGetReadOperations verifies each of the 12 GET paths has:
//   - a "get" method with non-empty operationId and summary
//   - query parameter names matching the expected list exactly
func TestGetReadOperations(t *testing.T) {
	root := loadSpec(t)

	// sorted for deterministic output
	paths := make([]string, 0, len(getExpectations))
	for p := range getExpectations {
		paths = append(paths, p)
	}
	sort.Strings(paths)

	for _, path := range paths {
		t.Run(path, func(t *testing.T) {
			methods, ok := root.Paths[path]
			if !ok {
				t.Fatalf("path %q not found in openapi.yaml", path)
			}
			get := methods["get"]
			if get == nil {
				t.Fatalf("path %q has no GET method", path)
			}
			if get.OperationID == "" {
				t.Errorf("path %q GET: operationId is empty", path)
			}
			if get.Summary == "" {
				t.Errorf("path %q GET: summary is empty", path)
			}
			got := queryParamNames(get)
			want := getExpectations[path]
			if !stringSetEqual(got, want) {
				t.Errorf("path %q GET query params mismatch:\n  got:  %v\n  want: %v", path, got, want)
			}
		})
	}
}

// deprecatedPostTwinPaths are paths where the POST sibling of the GET is a deprecated legacy twin.
var deprecatedPostTwinPaths = []string{
	"/dynamodb-streams/streams/{streamArn}/shards/{shardId}/iterator",
	"/dynamodb-streams/streams/{streamArn}/shards/{shardId}/records",
	"/ecr/images/batch-get/{repositoryName}",
	"/cloudwatch/metrics/statistics",
	"/cloudwatch/metrics/data",
	"/apigateway/rest-apis/{restApiId}/invoke-url",
	"/apigateway/apis/{apiId}/invoke-url",
	"/kinesis/streams/{streamName}/shards/{shardId}/iterator",
	"/secrets-manager/random-password",
}

// TestDeprecatedPostTwins verifies each path has a POST sibling marked deprecated=true.
func TestDeprecatedPostTwins(t *testing.T) {
	root := loadSpec(t)

	for _, path := range deprecatedPostTwinPaths {
		t.Run(path, func(t *testing.T) {
			methods, ok := root.Paths[path]
			if !ok {
				t.Fatalf("path %q not found", path)
			}
			post := methods["post"]
			if post == nil {
				t.Fatalf("path %q has no POST sibling", path)
			}
			if !post.Deprecated {
				t.Errorf("path %q POST: expected deprecated=true, got false", path)
			}
		})
	}
}

// nonDeprecatedPostPaths are paths where a POST operation exists but it is NOT a deprecated
// GET twin — it is a write operation that happens to share the same path (e.g. putParameter).
var nonDeprecatedPostPaths = []string{
	"/ssm/parameters",
	"/ssm/tags",
	"/iam/policies",
}

// TestNonDeprecatedPostOperations verifies these paths have a POST that is NOT deprecated.
func TestNonDeprecatedPostOperations(t *testing.T) {
	root := loadSpec(t)

	for _, path := range nonDeprecatedPostPaths {
		t.Run(path, func(t *testing.T) {
			methods, ok := root.Paths[path]
			if !ok {
				t.Fatalf("path %q not found", path)
			}
			post := methods["post"]
			if post == nil {
				t.Fatalf("path %q has no POST sibling", path)
			}
			if post.Deprecated {
				t.Errorf("path %q POST: expected deprecated=false (write op), got true", path)
			}
		})
	}
}

// dynamoReadPostPaths are paths where POST carries x-read-operation: true and no GET sibling exists.
var dynamoReadPostPaths = []string{
	"/dynamodb/tables/{tableName}/query",
	"/dynamodb/tables/{tableName}/scan",
	"/dynamodb/batch-get-item",
}

// TestDynamoReadPostOperations verifies POST has x-read-operation=true and no GET sibling.
func TestDynamoReadPostOperations(t *testing.T) {
	root := loadSpec(t)

	for _, path := range dynamoReadPostPaths {
		t.Run(path, func(t *testing.T) {
			methods, ok := root.Paths[path]
			if !ok {
				t.Fatalf("path %q not found", path)
			}
			if methods["get"] != nil {
				t.Errorf("path %q: unexpected GET sibling (should be POST-only)", path)
			}
			post := methods["post"]
			if post == nil {
				t.Fatalf("path %q: missing POST method", path)
			}
			xr, ok := post.XRead.(bool)
			if !ok || !xr {
				t.Errorf("path %q POST: expected x-read-operation=true, got %v", path, post.XRead)
			}
		})
	}
}

// TestS3PresignGetNoReadOperation verifies /s3/buckets/{bucket}/presign-get:
// POST exists, no x-read-operation, no GET sibling.
func TestS3PresignGetNoReadOperation(t *testing.T) {
	root := loadSpec(t)

	const path = "/s3/buckets/{bucket}/presign-get"
	methods, ok := root.Paths[path]
	if !ok {
		t.Fatalf("path %q not found", path)
	}
	if methods["get"] != nil {
		t.Errorf("path %q: unexpected GET sibling", path)
	}
	post := methods["post"]
	if post == nil {
		t.Fatalf("path %q: missing POST method", path)
	}
	if post.XRead != nil {
		t.Errorf("path %q POST: expected no x-read-operation, got %v", path, post.XRead)
	}
}
