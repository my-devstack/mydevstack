package httphandlers

import (
	"net/http"
	"testing"

	configloader "github.com/my-devstack/mydevstack/pkg/proxy/internal/config"
	"github.com/stretchr/testify/assert"
)

// ---------------------------------------------------------------------------
// Handler tests for handleRDS
// ---------------------------------------------------------------------------

func TestHandleRDS(t *testing.T) {
	t.Parallel()

	cfg := &configloader.Config{
		AWS: configloader.AWSProxyConfig{
			Endpoint: "http://127.0.0.1:1",
		},
	}
	svc := createMockSvc(t, cfg)
	versionSvc := createTestVersionService(t)
	handler := createHandler(svc, versionSvc)
	r := setupTestRouter(handler)

	t.Run("valid body endpoint unreachable returns 500", func(t *testing.T) {
		w := performRequest(r, "POST", "/rds/", "rds.DescribeDBInstances", []byte(`{"DBInstanceIdentifier":"test"}`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})

	t.Run("invalid body endpoint unreachable returns 500", func(t *testing.T) {
		w := performRequest(r, "POST", "/rds/", "rds.DescribeDBInstances", []byte(`{invalid`))
		assert.Equal(t, http.StatusInternalServerError, w.Code)
	})
}

// ---------------------------------------------------------------------------
// TestParseRDSXMLResponse
// ---------------------------------------------------------------------------

func TestParseRDSXMLResponse(t *testing.T) {
	t.Parallel()

	t.Run("DescribeDBInstancesResponse", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<DescribeDBInstancesResponse>
			<DescribeDBInstancesResult>
				<DBInstances>
					<DBInstance>
						<DBInstanceIdentifier>mydb</DBInstanceIdentifier>
					</DBInstance>
				</DBInstances>
			</DescribeDBInstancesResult>
		</DescribeDBInstancesResponse>`
		result, err := parseRDSXMLResponse(xmlBody, "DescribeDBInstances")
		assert.NoError(t, err)
		assert.Contains(t, result, "DBInstances")
		instances, ok := result["DBInstances"].([]map[string]interface{})
		assert.True(t, ok)
		assert.Len(t, instances, 1)
		inst := instances[0]
		assert.Equal(t, "mydb", inst["DBInstanceIdentifier"])
	})

	t.Run("CreateDBInstanceResponse", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<CreateDBInstanceResponse>
			<CreateDBInstanceResult>
				<DBInstance>
					<DBInstanceIdentifier>newdb</DBInstanceIdentifier>
					<DBInstanceStatus>creating</DBInstanceStatus>
				</DBInstance>
			</CreateDBInstanceResult>
		</CreateDBInstanceResponse>`
		result, err := parseRDSXMLResponse(xmlBody, "CreateDBInstance")
		assert.NoError(t, err)
		assert.Contains(t, result, "DBInstance")
		inst, ok := result["DBInstance"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, "newdb", inst["DBInstanceIdentifier"])
	})

	t.Run("DeleteDBInstanceResponse", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<DeleteDBInstanceResponse>
			<DeleteDBInstanceResult>
				<DBInstance>
					<DBInstanceIdentifier>deldb</DBInstanceIdentifier>
				</DBInstance>
			</DeleteDBInstanceResult>
		</DeleteDBInstanceResponse>`
		result, err := parseRDSXMLResponse(xmlBody, "DeleteDBInstance")
		assert.NoError(t, err)
		assert.Contains(t, result, "DBInstance")
		inst, ok := result["DBInstance"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, "deleted", inst["status"])
	})

	t.Run("ModifyDBInstanceResponse", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<ModifyDBInstanceResponse>
			<ModifyDBInstanceResult>
				<DBInstance>
					<DBInstanceIdentifier>moddb</DBInstanceIdentifier>
					<DBInstanceStatus>modifying</DBInstanceStatus>
				</DBInstance>
			</ModifyDBInstanceResult>
		</ModifyDBInstanceResponse>`
		result, err := parseRDSXMLResponse(xmlBody, "ModifyDBInstance")
		assert.NoError(t, err)
		assert.Contains(t, result, "DBInstance")
		inst, ok := result["DBInstance"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, "moddb", inst["DBInstanceIdentifier"])
	})

	t.Run("RebootDBInstanceResponse", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<RebootDBInstanceResponse>
			<RebootDBInstanceResult>
				<DBInstance>
					<DBInstanceIdentifier>rebootdb</DBInstanceIdentifier>
				</DBInstance>
			</RebootDBInstanceResult>
		</RebootDBInstanceResponse>`
		result, err := parseRDSXMLResponse(xmlBody, "RebootDBInstance")
		assert.NoError(t, err)
		assert.Contains(t, result, "DBInstance")
		inst, ok := result["DBInstance"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, "rebooting", inst["status"])
	})

	t.Run("DescribeDBEngineVersionsResponse", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<DescribeDBEngineVersionsResponse>
			<DescribeDBEngineVersionsResult>
				<DBEngineVersion>
					<Engine>mysql</Engine>
					<EngineVersion>8.0.35</EngineVersion>
				</DBEngineVersion>
			</DescribeDBEngineVersionsResult>
		</DescribeDBEngineVersionsResponse>`
		result, err := parseRDSXMLResponse(xmlBody, "DescribeDBEngineVersions")
		assert.NoError(t, err)
		assert.Contains(t, result, "EngineVersions")
		versions, ok := result["EngineVersions"].([]map[string]interface{})
		assert.True(t, ok)
		assert.Len(t, versions, 1)
	})

	t.Run("empty unknown XML returns empty result", func(t *testing.T) {
		t.Parallel()
		result, err := parseRDSXMLResponse("", "Unknown")
		assert.NoError(t, err)
		assert.Empty(t, result)
	})
}

// ---------------------------------------------------------------------------
// TestExtractDBInstances
// ---------------------------------------------------------------------------

func TestExtractDBInstances(t *testing.T) {
	t.Parallel()

	t.Run("MiniStack format uses DBInstance tags", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<DBInstances>
			<DBInstance>
				<DBInstanceIdentifier>db1</DBInstanceIdentifier>
			</DBInstance>
			<DBInstance>
				<DBInstanceIdentifier>db2</DBInstanceIdentifier>
			</DBInstance>
		</DBInstances>`
		instances := extractDBInstances(xmlBody)
		assert.Len(t, instances, 2)
	})

	t.Run("Floci format uses member tags", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<DBInstances>
			<member>
				<DBInstanceIdentifier>db1</DBInstanceIdentifier>
			</member>
			<member>
				<DBInstanceIdentifier>db2</DBInstanceIdentifier>
			</member>
		</DBInstances>`
		instances := extractDBInstances(xmlBody)
		assert.Len(t, instances, 2)
	})

	t.Run("no instances returns empty slice", func(t *testing.T) {
		t.Parallel()
		instances := extractDBInstances("<DBInstances></DBInstances>")
		assert.Empty(t, instances)
	})
}

// ---------------------------------------------------------------------------
// TestExtractDBInstanceDetails
// ---------------------------------------------------------------------------

func TestExtractDBInstanceDetails(t *testing.T) {
	t.Parallel()

	t.Run("valid XML content returns map", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<SomeResult>
			<DBInstance>
				<DBInstanceIdentifier>mydb</DBInstanceIdentifier>
				<DBInstanceStatus>available</DBInstanceStatus>
			</DBInstance>
		</SomeResult>`
		details := extractDBInstanceDetails(xmlBody)
		assert.NotNil(t, details)
		assert.Equal(t, "mydb", details["DBInstanceIdentifier"])
		assert.Equal(t, "available", details["DBInstanceStatus"])
	})

	t.Run("no DBInstance tag returns nil", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<SomeResult><OtherTag>value</OtherTag></SomeResult>`
		details := extractDBInstanceDetails(xmlBody)
		assert.Nil(t, details)
	})

	t.Run("missing closing DBInstance tag returns nil", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<SomeResult><DBInstance><DBInstanceIdentifier>mydb</DBInstanceIdentifier></SomeResult>`
		details := extractDBInstanceDetails(xmlBody)
		assert.Nil(t, details)
	})
}

// ---------------------------------------------------------------------------
// TestExtractDBEngineVersions
// ---------------------------------------------------------------------------

func TestExtractDBEngineVersions(t *testing.T) {
	t.Parallel()

	t.Run("valid DBEngineVersion tags", func(t *testing.T) {
		t.Parallel()
		xmlBody := `<DescribeDBEngineVersionsResult>
			<DBEngineVersion>
				<Engine>mysql</Engine>
				<EngineVersion>8.0.35</EngineVersion>
			</DBEngineVersion>
			<DBEngineVersion>
				<Engine>postgres</Engine>
				<EngineVersion>16.1</EngineVersion>
			</DBEngineVersion>
		</DescribeDBEngineVersionsResult>`
		versions := extractDBEngineVersions(xmlBody)
		assert.Len(t, versions, 2)
	})

	t.Run("no versions returns empty slice", func(t *testing.T) {
		t.Parallel()
		versions := extractDBEngineVersions("<Result></Result>")
		assert.Empty(t, versions)
	})
}

// ---------------------------------------------------------------------------
// TestExtractInstanceFields
// ---------------------------------------------------------------------------

func TestExtractInstanceFields(t *testing.T) {
	t.Parallel()

	t.Run("all fields including Endpoint and VpcSecurityGroups", func(t *testing.T) {
		t.Parallel()
		content := `<DBInstanceIdentifier>mydb</DBInstanceIdentifier>
<DBInstanceStatus>available</DBInstanceStatus>
<Engine>mysql</Engine>
<EngineVersion>8.0.35</EngineVersion>
<MasterUsername>admin</MasterUsername>
<DBInstanceClass>db.t3.micro</DBInstanceClass>
<AllocatedStorage>20</AllocatedStorage>
<IAMDatabaseAuthenticationEnabled>false</IAMDatabaseAuthenticationEnabled>
<MultiAZ>true</MultiAZ>
<StorageType>gp2</StorageType>
<PubliclyAccessible>true</PubliclyAccessible>
<DBName>testdb</DBName>
<EngineLifecycleSupport>open-source-rds-extended-support</EngineLifecycleSupport>
<LicenseModel>general-public-license</LicenseModel>
<DeletionProtection>false</DeletionProtection>
<BackupRetentionPeriod>7</BackupRetentionPeriod>
<PreferredBackupWindow>03:00-04:00</PreferredBackupWindow>
<PreferredMaintenanceWindow>mon:04:00-mon:05:00</PreferredMaintenanceWindow>
<Endpoint>
	<Address>mydb.xxxxxx.us-east-1.rds.amazonaws.com</Address>
	<Port>3306</Port>
</Endpoint>
<VpcSecurityGroups>
	<VpcSecurityGroupMembership>
		<VpcSecurityGroupId>sg-12345</VpcSecurityGroupId>
		<Status>active</Status>
	</VpcSecurityGroupMembership>
</VpcSecurityGroups>`

		instance := extractInstanceFields(content)
		assert.NotNil(t, instance)
		assert.Equal(t, "mydb", instance["DBInstanceIdentifier"])
		assert.Equal(t, "available", instance["DBInstanceStatus"])
		assert.Equal(t, "mysql", instance["Engine"])
		assert.Equal(t, true, instance["MultiAZ"])
		assert.Equal(t, true, instance["PubliclyAccessible"])
		assert.Equal(t, false, instance["IAMDatabaseAuthenticationEnabled"])
		assert.Equal(t, false, instance["DeletionProtection"])

		// Endpoint sub-object
		endpoint, ok := instance["Endpoint"].(map[string]interface{})
		assert.True(t, ok)
		assert.Equal(t, "mydb.xxxxxx.us-east-1.rds.amazonaws.com", endpoint["Address"])
		assert.Equal(t, "3306", endpoint["Port"])

		// VpcSecurityGroups
		groups, ok := instance["VpcSecurityGroups"].([]map[string]interface{})
		assert.True(t, ok)
		assert.Len(t, groups, 1)
		assert.Equal(t, "sg-12345", groups[0]["VpcSecurityGroupId"])
		assert.Equal(t, "active", groups[0]["Status"])
	})

	t.Run("empty content returns nil", func(t *testing.T) {
		t.Parallel()
		instance := extractInstanceFields("")
		assert.Nil(t, instance)
	})
}

// ---------------------------------------------------------------------------
// TestExtractEngineVersionFields
// ---------------------------------------------------------------------------

func TestExtractEngineVersionFields(t *testing.T) {
	t.Parallel()

	t.Run("all version fields", func(t *testing.T) {
		t.Parallel()
		content := `<Engine>mysql</Engine>
<EngineVersion>8.0.35</EngineVersion>
<DBEngineVersionDescription>MySQL 8.0.35</DBEngineVersionDescription>
<DBEngineMediaType>mysql</DBEngineMediaType>`
		version := extractEngineVersionFields(content)
		assert.NotNil(t, version)
		assert.Equal(t, "mysql", version["Engine"])
		assert.Equal(t, "8.0.35", version["EngineVersion"])
		assert.Equal(t, "MySQL 8.0.35", version["DBEngineVersionDescription"])
		assert.Equal(t, "mysql", version["DBEngineMediaType"])
	})

	t.Run("empty content returns nil", func(t *testing.T) {
		t.Parallel()
		version := extractEngineVersionFields("")
		assert.Nil(t, version)
	})
}

// ---------------------------------------------------------------------------
// TestToString
// ---------------------------------------------------------------------------

func TestToString(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name  string
		input interface{}
		want  string
	}{
		{"string", "hello", "hello"},
		{"float64", float64(42), "42"},
		{"bool true", true, "true"},
		{"bool false", false, "false"},
		{"int", 42, "42"},
		{"int64", int64(42), "42"},
		{"default type", struct{}{}, ""},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			got := toString(tt.input)
			assert.Equal(t, tt.want, got)
		})
	}
}

// ---------------------------------------------------------------------------
// TestMakeFormEncodedRequest
// ---------------------------------------------------------------------------

func TestMakeFormEncodedRequest(t *testing.T) {
	t.Parallel()

	t.Run("unreachable endpoint returns error", func(t *testing.T) {
		t.Parallel()
		_, err := makeFormEncodedRequest("http://127.0.0.1:1", "Action=DescribeDBInstances")
		assert.Error(t, err)
	})

	t.Run("invalid URL scheme returns error", func(t *testing.T) {
		t.Parallel()
		// Using an invalid URL scheme that causes http.NewRequest or client.Do to fail
		_, err := makeFormEncodedRequest("://invalid", "Action=DescribeDBInstances")
		assert.Error(t, err)
	})
}
