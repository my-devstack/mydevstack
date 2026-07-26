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

	"github.com/go-chi/chi/v5"
)

// rdsOperation performs a raw HTTP form-encoded RDS operation.
func (h *ProxyHandler) rdsOperation(w http.ResponseWriter, r *http.Request, operation string) {
	bodyBytes := readBody(r)
	baseEndpoint := h.Svc.Config().AWS.Endpoint

	formData := url.Values{}
	formData.Add("Action", operation)
	formData.Add("Version", "2014-10-31")

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

	resp, err := makeFormEncodedRequest(baseEndpoint, formData.Encode())
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to call RDS", err)
		return
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			log.Printf("Error closing response body: %v", err)
		}
	}()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to read response", err)
		return
	}

	result, err := parseRDSXMLResponse(string(respBody), operation)
	if err != nil {
		log.Printf("[RDS] Failed to parse XML response: %v", err)
		writeData(w, resp.StatusCode, "application/json", respBody)
		return
	}

	writeJSON(w, resp.StatusCode, result)
}

func (h *ProxyHandler) registerRDSRoutes(r chi.Router) {
	r.Route("/rds", func(r chi.Router) {
		r.Get("/db-instances", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "DescribeDBInstances")
		})
		r.Post("/db-instances", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "CreateDBInstance")
		})
		r.Delete("/db-instances/{id}", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "DeleteDBInstance")
		})
		r.Put("/db-instances/{id}", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "ModifyDBInstance")
		})
		r.Post("/db-instances/{id}/reboot", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "RebootDBInstance")
		})
		r.Get("/engine-versions", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "DescribeDBEngineVersions")
		})
		r.Get("/db-subnet-groups", func(w http.ResponseWriter, r *http.Request) {
			h.rdsOperation(w, r, "DescribeDBSubnetGroups")
		})
	})
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

	// Handle DescribeDBSubnetGroups response
	if strings.Contains(xmlBody, "DescribeDBSubnetGroupsResponse") {
		subnetGroups := extractDBSubnetGroups(xmlBody)
		result["DBSubnetGroups"] = subnetGroups
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

func extractDBSubnetGroups(xmlBody string) []map[string]interface{} {
	var groups []map[string]interface{}

	// First try MiniStack format: <DBSubnetGroup> tags
	marker := 0
	for {
		groupTag := "<DBSubnetGroup>"
		nextGroup := strings.Index(xmlBody[marker:], groupTag)
		if nextGroup == -1 {
			break
		}
		marker += nextGroup

		groupEnd := strings.Index(xmlBody[marker:], "</DBSubnetGroup>")
		if groupEnd == -1 {
			break
		}
		groupEnd += marker

		groupContent := xmlBody[marker:groupEnd]
		group := extractDBSubnetGroupFields(groupContent)
		if group != nil {
			groups = append(groups, group)
		}

		marker = groupEnd + len("</DBSubnetGroup>")
	}

	// If no groups found, try Floci format: <member> tags (depth-aware for nesting)
	if len(groups) == 0 {
		// First locate <DBSubnetGroups> section to constrain member search
		sectionStart := strings.Index(xmlBody, "<DBSubnetGroups>")
		if sectionStart == -1 {
			return groups
		}
		sectionStart += len("<DBSubnetGroups>")

		// Find matching </DBSubnetGroups> with depth awareness (unlikely nested but be safe)
		depth := 1
		sectionEnd := sectionStart
		for depth > 0 && sectionEnd < len(xmlBody) {
			nextOpen := strings.Index(xmlBody[sectionEnd:], "<DBSubnetGroups>")
			nextClose := strings.Index(xmlBody[sectionEnd:], "</DBSubnetGroups>")
			if nextClose == -1 {
				sectionEnd = len(xmlBody)
				break
			}
			if nextOpen != -1 && nextOpen < nextClose {
				depth++
				sectionEnd += nextOpen + len("<DBSubnetGroups>")
			} else {
				depth--
				sectionEnd += nextClose + len("</DBSubnetGroups>")
			}
		}

		sectionContent := xmlBody[sectionStart:sectionEnd]
		marker = 0
		for {
			nextMember := strings.Index(sectionContent[marker:], "<member>")
			if nextMember == -1 {
				break
			}
			marker += nextMember + len("<member>")

			// Depth-aware search for matching </member>
			memberDepth := 1
			memberEnd := marker
			for memberDepth > 0 && memberEnd < len(sectionContent) {
				nextOpen := strings.Index(sectionContent[memberEnd:], "<member>")
				nextClose := strings.Index(sectionContent[memberEnd:], "</member>")
				if nextClose == -1 {
					memberEnd = len(sectionContent)
					break
				}
				if nextOpen != -1 && nextOpen < nextClose {
					memberDepth++
					memberEnd += nextOpen + len("<member>")
				} else {
					memberDepth--
					memberEnd += nextClose + len("</member>")
				}
			}

			memberContent := sectionContent[marker : memberEnd-len("</member>")]
			group := extractDBSubnetGroupFields(memberContent)
			if group != nil {
				groups = append(groups, group)
			}

			marker = memberEnd
		}
	}

	return groups
}

func extractDBSubnetGroupFields(content string) map[string]interface{} {
	group := make(map[string]interface{})

	fields := []string{
		"DBSubnetGroupName", "DBSubnetGroupDescription", "VpcId", "SubnetGroupStatus",
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
		group[field] = content[start:end]
	}

	// Extract Subnets
	if strings.Contains(content, "<Subnets>") {
		subnetsStart := strings.Index(content, "<Subnets>") + len("<Subnets>")
		subnetsEnd := strings.Index(content, "</Subnets>")
		if subnetsEnd > subnetsStart {
			subnetsContent := content[subnetsStart:subnetsEnd]
			var subnets []map[string]interface{}

			// Support both <Subnet> and <member> within Subnets
			marker := 0
			for {
				nextSubnet := strings.Index(subnetsContent[marker:], "<Subnet>")
				if nextSubnet == -1 {
					break
				}
				marker += nextSubnet + len("<Subnet>")

				subnetEnd := strings.Index(subnetsContent[marker:], "</Subnet>")
				if subnetEnd == -1 {
					break
				}
				subnetEnd += marker

				subnetContent := subnetsContent[marker:subnetEnd]
				subnet := extractSubnetFields(subnetContent)
				if subnet != nil {
					subnets = append(subnets, subnet)
				}

				marker = subnetEnd + len("</Subnet>")
			}

			// Try Floci member format within Subnets (depth-aware)
			if len(subnets) == 0 {
				marker = 0
				for {
					nextMember := strings.Index(subnetsContent[marker:], "<member>")
					if nextMember == -1 {
						break
					}
					marker += nextMember + len("<member>")

					// Depth-aware search for matching </member>
					memberDepth := 1
					memberEnd := marker
					for memberDepth > 0 && memberEnd < len(subnetsContent) {
						nextOpen := strings.Index(subnetsContent[memberEnd:], "<member>")
						nextClose := strings.Index(subnetsContent[memberEnd:], "</member>")
						if nextClose == -1 {
							memberEnd = len(subnetsContent)
							break
						}
						if nextOpen != -1 && nextOpen < nextClose {
							memberDepth++
							memberEnd += nextOpen + len("<member>")
						} else {
							memberDepth--
							memberEnd += nextClose + len("</member>")
						}
					}

					memberContent := subnetsContent[marker : memberEnd-len("</member>")]
					subnet := extractSubnetFields(memberContent)
					if subnet != nil {
						subnets = append(subnets, subnet)
					}

					marker = memberEnd
				}
			}

			if len(subnets) > 0 {
				group["Subnets"] = subnets
			}
		}
	}

	if len(group) > 0 {
		return group
	}
	return nil
}

func extractSubnetFields(content string) map[string]interface{} {
	subnet := make(map[string]interface{})

	if idStart := strings.Index(content, "<SubnetIdentifier>"); idStart != -1 {
		idStart += len("<SubnetIdentifier>")
		idEnd := strings.Index(content, "</SubnetIdentifier>")
		if idEnd != -1 {
			subnet["SubnetIdentifier"] = content[idStart:idEnd]
		}
	}

	if azStart := strings.Index(content, "<SubnetAvailabilityZone>"); azStart != -1 {
		azStart += len("<SubnetAvailabilityZone>")
		azEnd := strings.Index(content, "</SubnetAvailabilityZone>")
		if azEnd != -1 {
			azContent := content[azStart:azEnd]
			// SubnetAvailabilityZone contains <Name> child tag
			nameStart := strings.Index(azContent, "<Name>")
			nameEnd := strings.Index(azContent, "</Name>")
			if nameStart != -1 && nameEnd != -1 {
				subnet["SubnetAvailabilityZone"] = azContent[nameStart+len("<Name>") : nameEnd]
			} else {
				subnet["SubnetAvailabilityZone"] = azContent
			}
		}
	}

	if statusStart := strings.Index(content, "<SubnetStatus>"); statusStart != -1 {
		statusStart += len("<SubnetStatus>")
		statusEnd := strings.Index(content, "</SubnetStatus>")
		if statusEnd != -1 {
			subnet["SubnetStatus"] = content[statusStart:statusEnd]
		}
	}

	if len(subnet) > 0 {
		return subnet
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
