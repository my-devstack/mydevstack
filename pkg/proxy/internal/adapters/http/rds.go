package httphandlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// handleRDS uses raw HTTP calls to work with Floci and ministack which expects query protocol (form-encoded)
// while SDK v2 sends JSON.

func (h *ProxyHandler) handleRDS(c *gin.Context) {
	xAmzTarget := c.GetHeader("X-Amz-Target")
	bodyBytes := readBody(c)
	baseEndpoint := h.svc.Config().AwsEndpoint

	// Extract operation name from X-Amz-Target (e.g., "rds.DescribeDBInstances" -> "DescribeDBInstances")
	operation := strings.Replace(xAmzTarget, "rds.", "", 1)

	// Convert JSON body to form-encoded for MiniStack/Floci
	formData := url.Values{}
	formData.Add("Action", operation)
	formData.Add("Version", "2014-10-31")

	// Parse JSON body and add to form data
	if len(bodyBytes) > 0 {
		var bodyMap map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &bodyMap); err == nil {
			for key, value := range bodyMap {
				if value != nil {
					formData.Add(key, toString(value))
				}
			}
		}
	}

	// Make form-encoded request
	resp, err := makeFormEncodedRequest(baseEndpoint, formData.Encode())
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to call RDS", err)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	// Read response
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		sendError(c, http.StatusInternalServerError, "Failed to read response", err)
		return
	}

	// Parse XML response to JSON
	result, err := parseRDSXMLResponse(string(respBody), operation)
	if err != nil {
		log.Printf("[RDS] Failed to parse XML response: %v", err)
		c.Data(resp.StatusCode, "application/json", respBody)
		return
	}

	c.JSON(resp.StatusCode, result)
}

func makeFormEncodedRequest(endpoint, formData string) (*http.Response, error) {
	client := &http.Client{Timeout: 60 * time.Second}
	req, err := http.NewRequest("POST", strings.TrimRight(endpoint, "/")+"/", strings.NewReader(formData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return client.Do(req)
}

func toString(v interface{}) string {
	switch v := v.(type) {
	case string:
		return v
	case float64:
		// Use fmt.Sprintf to properly convert float to string without scientific notation
		return fmt.Sprintf("%.0f", v)
	case bool:
		if v {
			return "true"
		}
		return "false"
	case int:
		return fmt.Sprintf("%d", v)
	case int64:
		return fmt.Sprintf("%d", v)
	default:
		return ""
	}
}

// parseRDSXMLResponse converts XML response from RDS to JSON
func parseRDSXMLResponse(xmlBody, operation string) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	// Handle DescribeDBInstances response
	if strings.Contains(xmlBody, "DescribeDBInstancesResponse") {
		instances := extractDBInstances(xmlBody)
		result["DBInstances"] = instances
	}

	// Handle CreateDBInstance response
	if strings.Contains(xmlBody, "CreateDBInstanceResponse") {
		instance := extractDBInstanceDetails(xmlBody)
		result["DBInstance"] = instance
	}

	// Handle DeleteDBInstance response
	if strings.Contains(xmlBody, "DeleteDBInstanceResponse") {
		result["DBInstance"] = map[string]interface{}{"status": "deleted"}
	}

	// Handle ModifyDBInstance response
	if strings.Contains(xmlBody, "ModifyDBInstanceResponse") {
		instance := extractDBInstanceDetails(xmlBody)
		result["DBInstance"] = instance
	}

	// Handle RebootDBInstance response
	if strings.Contains(xmlBody, "RebootDBInstanceResponse") {
		result["DBInstance"] = map[string]interface{}{"status": "rebooting"}
	}

	// Handle DescribeDBEngineVersions response
	if strings.Contains(xmlBody, "DescribeDBEngineVersionsResponse") {
		versions := extractDBEngineVersions(xmlBody)
		result["EngineVersions"] = versions
	}

	return result, nil
}

func extractDBInstances(xmlBody string) []map[string]interface{} {
	var instances []map[string]interface{}

	// MiniStack format: <DBInstance> tags directly under <DBInstances>
	marker := 0
	for {
		instanceTag := "<DBInstance>"
		nextInstance := strings.Index(xmlBody[marker:], instanceTag)
		if nextInstance == -1 {
			break
		}
		marker += nextInstance

		instanceEnd := strings.Index(xmlBody[marker:], "</DBInstance>")
		if instanceEnd == -1 {
			break
		}
		instanceEnd += marker

		instanceContent := xmlBody[marker:instanceEnd]
		instance := extractInstanceFields(instanceContent)
		if instance != nil {
			instances = append(instances, instance)
		}

		marker = instanceEnd + len("</DBInstance>")
	}

	// If no instances found, try Floci format: <member> tags
	if len(instances) == 0 {
		marker = 0
		for {
			memberTag := "<member>"
			nextMember := strings.Index(xmlBody[marker:], memberTag)
			if nextMember == -1 {
				break
			}
			marker += nextMember

			memberEnd := strings.Index(xmlBody[marker:], "</member>")
			if memberEnd == -1 {
				break
			}
			memberEnd += marker

			memberContent := xmlBody[marker:memberEnd]
			instance := extractInstanceFields(memberContent)
			if instance != nil {
				instances = append(instances, instance)
			}

			marker = memberEnd + len("</member>")
		}
	}

	return instances
}

func extractDBInstanceDetails(xmlBody string) map[string]interface{} {
	instanceStart := strings.Index(xmlBody, "<DBInstance>")
	if instanceStart == -1 {
		return nil
	}
	instanceStart += len("<DBInstance>")

	instanceEnd := strings.Index(xmlBody, "</DBInstance>")
	if instanceEnd == -1 || instanceEnd < instanceStart {
		return nil
	}

	instanceContent := xmlBody[instanceStart:instanceEnd]
	return extractInstanceFields(instanceContent)
}

func extractDBEngineVersions(xmlBody string) []map[string]interface{} {
	var versions []map[string]interface{}
	marker := 0
	for {
		memberTag := "<DBEngineVersion>"
		nextMember := strings.Index(xmlBody[marker:], memberTag)
		if nextMember == -1 {
			break
		}
		marker += nextMember

		memberEnd := strings.Index(xmlBody[marker:], "</DBEngineVersion>")
		if memberEnd == -1 {
			break
		}
		memberEnd += marker

		memberContent := xmlBody[marker:memberEnd]
		version := extractEngineVersionFields(memberContent)
		if version != nil {
			versions = append(versions, version)
		}

		marker = memberEnd + len("</DBEngineVersion>")
	}
	return versions
}

func extractInstanceFields(content string) map[string]interface{} {
	instance := make(map[string]interface{})

	fields := []string{
		"DBInstanceIdentifier", "DBInstanceStatus", "Engine", "EngineVersion",
		"MasterUsername", "DBInstanceClass", "AllocatedStorage", "IAMDatabaseAuthenticationEnabled",
		"MultiAZ", "StorageType", "PubliclyAccessible", "DBName", "EngineLifecycleSupport",
		"LicenseModel", "DBSystemId", "DeletionProtection", "EnhancedMonitoringResourceArn",
		"MonitoringRoleArn", "MonitoringInterval", "PerformanceInsightsEnabled",
		"BackupRetentionPeriod", "PreferredBackupWindow", "PreferredMaintenanceWindow",
	}

	for _, field := range fields {
		tag := "<" + field + ">"
		start := strings.Index(content, tag)
		if start == -1 {
			continue
		}
		start += len(tag)
		end := strings.Index(content, "</"+field+">")
		if end == -1 || end < start {
			continue
		}
		value := content[start:end]

		switch value {
		case "true":
			instance[field] = true
		case "false":
			instance[field] = false
		default:
			instance[field] = value
		}
	}

	// Extract Endpoint
	endpointStart := strings.Index(content, "<Endpoint>")
	if endpointStart != -1 {
		endpointStart += len("<Endpoint>")
		endpointEnd := strings.Index(content, "</Endpoint>")
		if endpointEnd != -1 && endpointEnd > endpointStart {
			endpointContent := content[endpointStart:endpointEnd]

			addrStart := strings.Index(endpointContent, "<Address>")
			addrEnd := strings.Index(endpointContent, "</Address>")
			portStart := strings.Index(endpointContent, "<Port>")
			portEnd := strings.Index(endpointContent, "</Port>")

			if addrStart != -1 && addrEnd != -1 && portStart != -1 && portEnd != -1 {
				instance["Endpoint"] = map[string]interface{}{
					"Address": endpointContent[addrStart+len("<Address>") : addrEnd],
					"Port":    endpointContent[portStart+len("<Port>") : portEnd],
				}
			}
		}
	}

	// Extract VPC security groups
	if strings.Contains(content, "<VpcSecurityGroups>") {
		vpcStart := strings.Index(content, "<VpcSecurityGroups>") + len("<VpcSecurityGroups>")
		vpcEnd := strings.Index(content, "</VpcSecurityGroups>")
		if vpcEnd > vpcStart {
			vpcContent := content[vpcStart:vpcEnd]
			var groups []map[string]interface{}
			for strings.Contains(vpcContent, "<VpcSecurityGroupMembership>") {
				vsStart := strings.Index(vpcContent, "<VpcSecurityGroupMembership>") + len("<VpcSecurityGroupMembership>")
				vsEnd := strings.Index(vpcContent, "</VpcSecurityGroupMembership>")
				if vsEnd == -1 {
					break
				}
				vsContent := vpcContent[vsStart:vsEnd]

				group := make(map[string]interface{})
				if idStart := strings.Index(vsContent, "<VpcSecurityGroupId>"); idStart != -1 {
					idStart += len("<VpcSecurityGroupId>")
					idEnd := strings.Index(vsContent, "</VpcSecurityGroupId>")
					if idEnd != -1 {
						group["VpcSecurityGroupId"] = vsContent[idStart:idEnd]
					}
				}
				if statusStart := strings.Index(vsContent, "<Status>"); statusStart != -1 {
					statusStart += len("<Status>")
					statusEnd := strings.Index(vsContent, "</Status>")
					if statusEnd != -1 {
						group["Status"] = vsContent[statusStart:statusEnd]
					}
				}
				if len(group) > 0 {
					groups = append(groups, group)
				}
				vpcContent = vpcContent[vsEnd+len("</VpcSecurityGroupMembership>"):]
			}
			if len(groups) > 0 {
				instance["VpcSecurityGroups"] = groups
			}
		}
	}

	if len(instance) > 0 {
		return instance
	}
	return nil
}

func extractEngineVersionFields(content string) map[string]interface{} {
	version := make(map[string]interface{})

	fields := []string{
		"Engine", "EngineVersion", "DBEngineVersionDescription",
		"DBEngineMediaType", "DefaultCharacterSet", "SupportedCharacterSets",
		"ExportableCharacterSets", "SupportedNcharCharacterSets",
		"ValidEngineMode", "ValidCertificateForCrossRegionEncryption",
	}

	for _, field := range fields {
		tag := "<" + field + ">"
		start := strings.Index(content, tag)
		if start == -1 {
			continue
		}
		start += len(tag)
		end := strings.Index(content, "</"+field+">")
		if end == -1 || end < start {
			continue
		}
		version[field] = content[start:end]
	}

	if len(version) > 0 {
		return version
	}
	return nil
}
