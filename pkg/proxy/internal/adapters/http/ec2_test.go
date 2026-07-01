package httphandlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aws/aws-sdk-go-v2/service/ec2"
	mockports "github.com/my-devstack/mydevstack/pkg/proxy/mocks/ports"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func setupEC2Test(t *testing.T) (*mockports.ProxyService, *mockports.EC2Port, *ProxyHandler) {
	svc := createMockSvc(t, nil)
	mp := mockports.NewEC2Port(t)
	svc.EXPECT().EC2().Return(mp).Maybe()
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	return svc, mp, handler
}

func performEC2Request(handler *ProxyHandler, method, path string, body []byte) *httptest.ResponseRecorder {
	r := setupTestRouter(handler)
	return performRequest(r, method, path, body)
}

// ---------------------------------------------------------------------------
// ListInstances
// ---------------------------------------------------------------------------

func TestEC2_ListInstances_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeInstances(mock.Anything, mock.Anything).Return(&ec2.DescribeInstancesOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/instances", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_ListInstances_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeInstances(mock.Anything, mock.Anything).Return(nil, errors.New("list instances error"))

	w := performEC2Request(handler, "GET", "/ec2/instances", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list instances")
}

// ---------------------------------------------------------------------------
// RunInstance
// ---------------------------------------------------------------------------

func TestEC2_RunInstance_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().RunInstances(mock.Anything, mock.Anything).Return(&ec2.RunInstancesOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/instances", []byte(`{"ImageId":"ami-123","MaxCount":1,"MinCount":1}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_RunInstance_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().RunInstances(mock.Anything, mock.Anything).Return(nil, errors.New("run instance error"))

	w := performEC2Request(handler, "POST", "/ec2/instances", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to run instance")
}

// ---------------------------------------------------------------------------
// GetInstance
// ---------------------------------------------------------------------------

func TestEC2_GetInstance_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeInstances(mock.Anything, mock.Anything).Return(&ec2.DescribeInstancesOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/instances/i-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_GetInstance_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeInstances(mock.Anything, mock.Anything).Return(nil, errors.New("get instance error"))

	w := performEC2Request(handler, "GET", "/ec2/instances/i-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to get instance")
}

// ---------------------------------------------------------------------------
// TerminateInstance
// ---------------------------------------------------------------------------

func TestEC2_TerminateInstance_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().TerminateInstances(mock.Anything, mock.Anything).Return(&ec2.TerminateInstancesOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/instances/i-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_TerminateInstance_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().TerminateInstances(mock.Anything, mock.Anything).Return(nil, errors.New("terminate instance error"))

	w := performEC2Request(handler, "DELETE", "/ec2/instances/i-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to terminate instance")
}

// ---------------------------------------------------------------------------
// StartInstance
// ---------------------------------------------------------------------------

func TestEC2_StartInstance_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().StartInstances(mock.Anything, mock.Anything).Return(&ec2.StartInstancesOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/instances/i-123/start", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_StartInstance_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().StartInstances(mock.Anything, mock.Anything).Return(nil, errors.New("start instance error"))

	w := performEC2Request(handler, "POST", "/ec2/instances/i-123/start", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to start instance")
}

// ---------------------------------------------------------------------------
// StopInstance
// ---------------------------------------------------------------------------

func TestEC2_StopInstance_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().StopInstances(mock.Anything, mock.Anything).Return(&ec2.StopInstancesOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/instances/i-123/stop", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_StopInstance_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().StopInstances(mock.Anything, mock.Anything).Return(nil, errors.New("stop instance error"))

	w := performEC2Request(handler, "POST", "/ec2/instances/i-123/stop", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to stop instance")
}

// ---------------------------------------------------------------------------
// ListKeyPairs
// ---------------------------------------------------------------------------

func TestEC2_ListKeyPairs_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeKeyPairs(mock.Anything, mock.Anything).Return(&ec2.DescribeKeyPairsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/key-pairs", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_ListKeyPairs_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeKeyPairs(mock.Anything, mock.Anything).Return(nil, errors.New("list key pairs error"))

	w := performEC2Request(handler, "GET", "/ec2/key-pairs", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list key pairs")
}

// ---------------------------------------------------------------------------
// CreateKeyPair
// ---------------------------------------------------------------------------

func TestEC2_CreateKeyPair_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().CreateKeyPair(mock.Anything, mock.Anything).Return(&ec2.CreateKeyPairOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/key-pairs", []byte(`{"KeyName":"test-key"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_CreateKeyPair_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().CreateKeyPair(mock.Anything, mock.Anything).Return(nil, errors.New("create key pair error"))

	w := performEC2Request(handler, "POST", "/ec2/key-pairs", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create key pair")
}

// ---------------------------------------------------------------------------
// ImportKeyPair
// ---------------------------------------------------------------------------

func TestEC2_ImportKeyPair_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().ImportKeyPair(mock.Anything, mock.Anything).Return(&ec2.ImportKeyPairOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/key-pairs/import", []byte(`{"KeyName":"test-key","PublicKeyMaterial":"c3NoLXJzYQo="}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_ImportKeyPair_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().ImportKeyPair(mock.Anything, mock.Anything).Return(nil, errors.New("import key pair error"))

	w := performEC2Request(handler, "POST", "/ec2/key-pairs/import", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to import key pair")
}

// ---------------------------------------------------------------------------
// DeleteKeyPair
// ---------------------------------------------------------------------------

func TestEC2_DeleteKeyPair_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DeleteKeyPair(mock.Anything, mock.Anything).Return(&ec2.DeleteKeyPairOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/key-pairs/test-key", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_DeleteKeyPair_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DeleteKeyPair(mock.Anything, mock.Anything).Return(nil, errors.New("delete key pair error"))

	w := performEC2Request(handler, "DELETE", "/ec2/key-pairs/test-key", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete key pair")
}

// ---------------------------------------------------------------------------
// ListSecurityGroups
// ---------------------------------------------------------------------------

func TestEC2_ListSecurityGroups_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeSecurityGroups(mock.Anything, mock.Anything).Return(&ec2.DescribeSecurityGroupsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/security-groups", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_ListSecurityGroups_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeSecurityGroups(mock.Anything, mock.Anything).Return(nil, errors.New("list security groups error"))

	w := performEC2Request(handler, "GET", "/ec2/security-groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list security groups")
}

// ---------------------------------------------------------------------------
// CreateSecurityGroup
// ---------------------------------------------------------------------------

func TestEC2_CreateSecurityGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().CreateSecurityGroup(mock.Anything, mock.Anything).Return(&ec2.CreateSecurityGroupOutput{}, nil)

	w := performEC2Request(handler, "POST", "/ec2/security-groups", []byte(`{"GroupName":"test-sg","Description":"Test SG"}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_CreateSecurityGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().CreateSecurityGroup(mock.Anything, mock.Anything).Return(nil, errors.New("create security group error"))

	w := performEC2Request(handler, "POST", "/ec2/security-groups", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to create security group")
}

// ---------------------------------------------------------------------------
// DeleteSecurityGroup
// ---------------------------------------------------------------------------

func TestEC2_DeleteSecurityGroup_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DeleteSecurityGroup(mock.Anything, mock.Anything).Return(&ec2.DeleteSecurityGroupOutput{}, nil)

	w := performEC2Request(handler, "DELETE", "/ec2/security-groups/sg-123", nil)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_DeleteSecurityGroup_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DeleteSecurityGroup(mock.Anything, mock.Anything).Return(nil, errors.New("delete security group error"))

	w := performEC2Request(handler, "DELETE", "/ec2/security-groups/sg-123", nil)
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to delete security group")
}

// ---------------------------------------------------------------------------
// AuthorizeIngress
// ---------------------------------------------------------------------------

func TestEC2_AuthorizeIngress_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().AuthorizeSecurityGroupIngress(mock.Anything, mock.Anything).Return(&ec2.AuthorizeSecurityGroupIngressOutput{}, nil)

	body := `{"IpPermissions":[{"IpProtocol":"tcp","FromPort":22,"ToPort":22,"IpRanges":[{"CidrIp":"0.0.0.0/0"}]}]}`
	w := performEC2Request(handler, "POST", "/ec2/security-groups/sg-123/ingress", []byte(body))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_AuthorizeIngress_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().AuthorizeSecurityGroupIngress(mock.Anything, mock.Anything).Return(nil, errors.New("authorize ingress error"))

	w := performEC2Request(handler, "POST", "/ec2/security-groups/sg-123/ingress", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to authorize ingress")
}

// ---------------------------------------------------------------------------
// ListVpcs
// ---------------------------------------------------------------------------

func TestEC2_ListVpcs_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeVpcs(mock.Anything, mock.Anything).Return(&ec2.DescribeVpcsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/vpcs", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_ListVpcs_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeVpcs(mock.Anything, mock.Anything).Return(nil, errors.New("list vpcs error"))

	w := performEC2Request(handler, "GET", "/ec2/vpcs", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list VPCs")
}

// ---------------------------------------------------------------------------
// ListSubnets
// ---------------------------------------------------------------------------

func TestEC2_ListSubnets_Success(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeSubnets(mock.Anything, mock.Anything).Return(&ec2.DescribeSubnetsOutput{}, nil)

	w := performEC2Request(handler, "GET", "/ec2/subnets", []byte(`{}`))
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestEC2_ListSubnets_Error(t *testing.T) {
	t.Parallel()
	_, mp, handler := setupEC2Test(t)
	mp.EXPECT().DescribeSubnets(mock.Anything, mock.Anything).Return(nil, errors.New("list subnets error"))

	w := performEC2Request(handler, "GET", "/ec2/subnets", []byte(`{}`))
	assert.Equal(t, http.StatusInternalServerError, w.Code)
	var resp map[string]interface{}
	assert.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	assert.Contains(t, resp["error"], "Failed to list subnets")
}

// ---------------------------------------------------------------------------
// Parse error — invalid JSON body returns 400 for actions that call parseBody
// ---------------------------------------------------------------------------

func TestEC2_ParseError(t *testing.T) {
	t.Parallel()

	routerActions := []struct {
		name   string
		method string
		path   string
	}{
		{name: "ListInstances", method: "GET", path: "/ec2/instances"},
		{name: "RunInstance", method: "POST", path: "/ec2/instances"},
		{name: "ListKeyPairs", method: "GET", path: "/ec2/key-pairs"},
		{name: "CreateKeyPair", method: "POST", path: "/ec2/key-pairs"},
		{name: "ImportKeyPair", method: "POST", path: "/ec2/key-pairs/import"},
		{name: "ListSecurityGroups", method: "GET", path: "/ec2/security-groups"},
		{name: "CreateSecurityGroup", method: "POST", path: "/ec2/security-groups"},
		{name: "AuthorizeIngress", method: "POST", path: "/ec2/security-groups/sg-123/ingress"},
		{name: "ListVpcs", method: "GET", path: "/ec2/vpcs"},
		{name: "ListSubnets", method: "GET", path: "/ec2/subnets"},
	}

	for _, ra := range routerActions {
		ra := ra
		t.Run(ra.name, func(t *testing.T) {
			t.Parallel()
			_, _, handler := setupEC2Test(t)
			w := performEC2Request(handler, ra.method, ra.path, []byte(`{bad json`))
			assert.Equal(t, http.StatusBadRequest, w.Code, "method=%s path=%s body=%s", ra.method, ra.path, w.Body.String())
			var resp map[string]interface{}
			err := json.Unmarshal(w.Body.Bytes(), &resp)
			assert.NoError(t, err)
			assert.Contains(t, resp["error"], "Invalid request body")
		})
	}
}
