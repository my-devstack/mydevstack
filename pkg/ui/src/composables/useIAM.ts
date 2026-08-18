import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { IAMUser, IAMRole, IAMPolicy, IAMGroup } from '@/api/types/aws'
import * as iamApi from '@/api/services/iam'

export interface AccessKeyInfo {
  AccessKeyId: string
  Status: 'Active' | 'Inactive'
  CreateDate: string
}

export interface AttachedPolicy {
  PolicyName: string
  PolicyArn: string
}

export function useIAM() {
  const toast = useToast()

  const users = ref<IAMUser[]>([])
  const roles = ref<IAMRole[]>([])
  const policies = ref<IAMPolicy[]>([])
  const groups = ref<IAMGroup[]>([])
  const loading = ref(false)

  const userAccessKeysMap = ref<Record<string, AccessKeyInfo[]>>({})
  const rolePoliciesMap = ref<Record<string, AttachedPolicy[]>>({})
  const groupUsersMap = ref<Record<string, IAMUser[]>>({})
  const policyDocuments = ref<Record<string, any>>({})
  const expandedUsers = ref<Set<string>>(new Set())
  const expandedRoles = ref<Set<string>>(new Set())
  const expandedPolicies = ref<Set<string>>(new Set())
  const expandedGroups = ref<Set<string>>(new Set())

  async function loadUsers() {
    loading.value = true
    try {
      const result = await iamApi.listUsers()
      users.value = result.Users as IAMUser[]
    } catch (error) {
      toast.error('Failed to load users: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createUser(userName: string, path?: string) {
    await iamApi.createUser({ UserName: userName, Path: path })
    toast.success(`User "${userName}" created successfully`)
    await loadUsers()
  }

  async function deleteUser(userName: string) {
    await iamApi.deleteUser(userName)
    toast.success(`User "${userName}" deleted successfully`)
    await loadUsers()
  }

  async function loadUserAccessKeys(userName: string): Promise<AccessKeyInfo[]> {
    try {
      const result = await iamApi.listAccessKeys(userName)
      const keys = result.AccessKeyMetadata || []
      userAccessKeysMap.value[userName] = keys
      return keys
    } catch (error) {
      toast.error(`Failed to load access keys: ${error}`)
      return []
    }
  }

  async function createAccessKey(userName: string) {
    const result = await iamApi.createAccessKey(userName)
    const accessKey = result.AccessKey || result
    await loadUserAccessKeys(userName)
    return {
      AccessKeyId: accessKey.AccessKeyId,
      SecretAccessKey: accessKey.SecretAccessKey,
    }
  }

  async function deleteAccessKey(accessKeyId: string, userName: string) {
    await iamApi.deleteAccessKey(accessKeyId, userName)
    toast.success('Access key deleted successfully')
    await loadUserAccessKeys(userName)
  }

  async function loadRoles() {
    loading.value = true
    try {
      const result = await iamApi.listRoles()
      roles.value = result.Roles as IAMRole[]
    } catch (error) {
      toast.error('Failed to load roles: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createRole(roleName: string, assumeRolePolicyDocument: string, description?: string) {
    await iamApi.createRole({
      RoleName: roleName,
      AssumeRolePolicyDocument: assumeRolePolicyDocument,
      Description: description,
    })
    toast.success(`Role "${roleName}" created successfully`)
    await loadRoles()
  }

  async function deleteRole(roleName: string) {
    await iamApi.deleteRole(roleName)
    toast.success(`Role "${roleName}" deleted successfully`)
    await loadRoles()
  }

  async function loadRolePolicies(roleName: string): Promise<AttachedPolicy[]> {
    try {
      const result = await iamApi.listAttachedRolePolicies(roleName)
      const policies = result.AttachedPolicies || []
      rolePoliciesMap.value[roleName] = policies
      return policies
    } catch (error) {
      toast.error(`Failed to load role policies: ${error}`)
      return []
    }
  }

  async function loadAllPolicies(): Promise<IAMPolicy[]> {
      const result = await iamApi.listPolicies({ Scope: 'All' })
      return result.Policies as unknown as IAMPolicy[]
  }

  async function attachPolicy(roleName: string, policyArn: string) {
    await iamApi.attachRolePolicy(roleName, policyArn)
    toast.success('Policy attached successfully')
    await loadRolePolicies(roleName)
  }

  async function detachPolicy(roleName: string, policyArn: string) {
    await iamApi.detachRolePolicy(roleName, policyArn)
    toast.success('Policy detached successfully')
    await loadRolePolicies(roleName)
  }

  async function loadPolicies() {
    loading.value = true
    try {
      const result = await iamApi.listPolicies({ Scope: 'All' })
      policies.value = result.Policies as unknown as IAMPolicy[]
    } catch (error) {
      toast.error('Failed to load policies: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function loadPolicyDocument(policyArn: string) {
    if (policyDocuments.value[policyArn]) return
    try {
      const result = await iamApi.getPolicy(policyArn)
      policyDocuments.value[policyArn] = result.Policy
    } catch (error) {
      toast.error(`Failed to load policy document: ${error}`)
    }
  }

  async function deletePolicy(policyArn: string, policyName: string) {
    await iamApi.deletePolicy(policyArn)
    toast.success(`Policy "${policyName}" deleted`)
    expandedPolicies.value.delete(policyArn)
    await loadPolicies()
  }

  async function createPolicy(policyName: string, policyDocument: string, description?: string) {
    await iamApi.createPolicy({
      PolicyName: policyName,
      PolicyDocument: policyDocument,
      Description: description,
    })
    toast.success(`Policy "${policyName}" created successfully`)
    await loadPolicies()
  }

  async function loadGroups() {
    loading.value = true
    try {
      const result = await iamApi.listGroups()
      groups.value = result.Groups as IAMGroup[]
    } catch (error) {
      toast.error('Failed to load groups: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createGroup(groupName: string, path?: string) {
    await iamApi.createGroup(groupName, path)
    toast.success(`Group "${groupName}" created successfully`)
    await loadGroups()
  }

  async function deleteGroup(groupName: string) {
    await iamApi.deleteGroup(groupName)
    toast.success(`Group "${groupName}" deleted successfully`)
    expandedGroups.value.delete(groupName)
    await loadGroups()
  }

  async function loadGroupUsers(groupName: string): Promise<IAMUser[]> {
    try {
      const result = await iamApi.listUsersForGroup(groupName)
      const users = result.Users || []
      groupUsersMap.value[groupName] = users
      return users
    } catch (error) {
      toast.error(`Failed to load group users: ${error}`)
      return []
    }
  }

  async function addUserToGroup(groupName: string, userName: string) {
    await iamApi.addUserToGroup(groupName, userName)
    toast.success(`User "${userName}" added to group`)
    await loadGroupUsers(groupName)
  }

  async function removeUserFromGroup(groupName: string, userName: string) {
    await iamApi.removeUserFromGroup(groupName, userName)
    toast.success(`User "${userName}" removed from group`)
    await loadGroupUsers(groupName)
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  async function loadAll() {
    await Promise.all([loadUsers(), loadRoles(), loadPolicies(), loadGroups()])
  }

  // Code examples
  const codeExamples = computed(() => {
    const settingsStore = useSettingsStore()
    return [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List IAM users
aws iam list-users --endpoint-url ${settingsStore.publicEndpoint}

# Create IAM user
aws iam create-user \\
  --user-name alice \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Create access key for user
aws iam create-access-key \\
  --user-name alice \\
  --endpoint-url ${settingsStore.publicEndpoint}

# List access keys for user
aws iam list-access-keys \\
  --user-name alice \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Delete IAM user
aws iam delete-user \\
  --user-name alice \\
  --endpoint-url ${settingsStore.publicEndpoint}

# List IAM roles
aws iam list-roles --endpoint-url ${settingsStore.publicEndpoint}

# Create IAM role
aws iam create-role \\
  --role-name ec2-role \\
  --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \\
  --endpoint-url ${settingsStore.publicEndpoint}

# List IAM policies
aws iam list-policies --endpoint-url ${settingsStore.publicEndpoint}

# Create IAM policy
aws iam create-policy \\
  --policy-name my-s3-policy \\
  --policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Action":"s3:ListBucket","Resource":"arn:aws:s3:::my-bucket"}]}' \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Attach policy to role
aws iam attach-role-policy \\
  --role-name ec2-role \\
  --policy-arn arn:aws:iam::000000000000:policy/my-s3-policy \\
  --endpoint-url ${settingsStore.publicEndpoint}

# List IAM groups
aws iam list-groups --endpoint-url ${settingsStore.publicEndpoint}

# Create IAM group
aws iam create-group \\
  --group-name developers \\
  --endpoint-url ${settingsStore.publicEndpoint}

# Add user to group
aws iam add-user-to-group \\
  --user-name alice \\
  --group-name developers \\
  --endpoint-url ${settingsStore.publicEndpoint}

# List users in group
aws iam get-group \\
  --group-name developers \\
  --endpoint-url ${settingsStore.publicEndpoint}`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { IAMClient, ListUsersCommand, CreateUserCommand, CreateAccessKeyCommand, ListAccessKeysCommand, DeleteUserCommand, ListRolesCommand, CreateRoleCommand, ListPoliciesCommand, CreatePolicyCommand, AttachRolePolicyCommand, ListGroupsCommand, CreateGroupCommand, AddUserToGroupCommand, GetGroupCommand } from "@aws-sdk/client-iam";

const client = new IAMClient({
  region: '${settingsStore.region}',
  endpoint: '${settingsStore.publicEndpoint}',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List users
const users = await client.send(new ListUsersCommand({}));
console.log(users.Users);

// Create user
await client.send(new CreateUserCommand({ UserName: 'alice' }));

// Create access key
const accessKey = await client.send(new CreateAccessKeyCommand({ UserName: 'alice' }));
console.log(accessKey.AccessKey);

// List roles
const roles = await client.send(new ListRolesCommand({}));
console.log(roles.Roles);

// Create role
await client.send(new CreateRoleCommand({
  RoleName: 'ec2-role',
  AssumeRolePolicyDocument: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Service: 'ec2.amazonaws.com' },
      Action: 'sts:AssumeRole'
    }]
  }),
}));

// Create policy
const policy = await client.send(new CreatePolicyCommand({
  PolicyName: 'my-s3-policy',
  PolicyDocument: JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Action: 's3:ListBucket',
      Resource: 'arn:aws:s3:::my-bucket'
    }]
  }),
}));

// Attach policy to role
await client.send(new AttachRolePolicyCommand({
  RoleName: 'ec2-role',
  PolicyArn: policy.Policy.Arn,
}));

// Create group
await client.send(new CreateGroupCommand({ GroupName: 'developers' }));

// Add user to group
await client.send(new AddUserToGroupCommand({
  UserName: 'alice',
  GroupName: 'developers',
}));

// List groups
const groups = await client.send(new ListGroupsCommand({}));
console.log(groups.Groups);`
    },
    {
      language: 'python',
      label: 'Python',
      code: `# Using boto3
import boto3
import json

client = boto3.client(
    'iam',
    region_name='${settingsStore.region}',
    endpoint_url='${settingsStore.publicEndpoint}',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List users
response = client.list_users()
for user in response['Users']:
    print(user['UserName'])

# Create user
client.create_user(UserName='alice')

# Create access key
response = client.create_access_key(UserName='alice')
print(response['AccessKey'])

# List roles
response = client.list_roles()
for role in response['Roles']:
    print(role['RoleName'])

# Create role
client.create_role(
    RoleName='ec2-role',
    AssumeRolePolicyDocument=json.dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Effect': 'Allow',
            'Principal': {'Service': 'ec2.amazonaws.com'},
            'Action': 'sts:AssumeRole'
        }]
    })
)

# Create policy
policy = client.create_policy(
    PolicyName='my-s3-policy',
    PolicyDocument=json.dumps({
        'Version': '2012-10-17',
        'Statement': [{
            'Effect': 'Allow',
            'Action': 's3:ListBucket',
            'Resource': 'arn:aws:s3:::my-bucket'
        }]
    })
)

# Attach policy to role
client.attach_role_policy(
    RoleName='ec2-role',
    PolicyArn=policy['Policy']['Arn']
)

# Create group
client.create_group(GroupName='developers')

# Add user to group
client.add_user_to_group(UserName='alice', GroupName='developers')

# List groups
response = client.list_groups()
for group in response['Groups']:
    print(group['GroupName'])`
    },
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "encoding/json"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/iam"
    "github.com/aws/aws-sdk-go-v2/service/iam/types"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := iam.NewFromConfig(cfg, func(o *iam.Options) {
    o.BaseEndpoint = "${settingsStore.publicEndpoint}"
})

ctx := context.Background()

// List users
users, _ := client.ListUsers(ctx, &iam.ListUsersInput{})
for _, u := range users.Users {
    fmt.Println(*u.UserName)
}

// Create user
client.CreateUser(ctx, &iam.CreateUserInput{UserName: aws.String("alice")})

// Create access key
key, _ := client.CreateAccessKey(ctx, &iam.CreateAccessKeyInput{UserName: aws.String("alice")})
fmt.Println(*key.AccessKey.AccessKeyId)

// List roles
roles, _ := client.ListRoles(ctx, &iam.ListRolesInput{})
for _, r := range roles.Roles {
    fmt.Println(*r.RoleName)
}

// Create role
policyDoc, _ := json.Marshal(map[string]interface{}{
    "Version": "2012-10-17",
    "Statement": []map[string]interface{}{
        {"Effect": "Allow", "Principal": map[string]string{"Service": "ec2.amazonaws.com"}, "Action": "sts:AssumeRole"},
    },
})
client.CreateRole(ctx, &iam.CreateRoleInput{
    RoleName:                 aws.String("ec2-role"),
    AssumeRolePolicyDocument: aws.String(string(policyDoc)),
})

// List policies
policies, _ := client.ListPolicies(ctx, &iam.ListPoliciesInput{})
for _, p := range policies.Policies {
    fmt.Println(*p.PolicyName)
}

// Create policy
policyDoc2, _ := json.Marshal(map[string]interface{}{
    "Version": "2012-10-17",
    "Statement": []map[string]interface{}{
        {"Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::my-bucket"},
    },
})
policy, _ := client.CreatePolicy(ctx, &iam.CreatePolicyInput{
    PolicyName:     aws.String("my-s3-policy"),
    PolicyDocument: aws.String(string(policyDoc2)),
})
fmt.Println(*policy.Policy.Arn)

// Attach policy to role
client.AttachRolePolicy(ctx, &iam.AttachRolePolicyInput{
    RoleName:  aws.String("ec2-role"),
    PolicyArn: policy.Policy.Arn,
})

// List groups
groups, _ := client.ListGroups(ctx, &iam.ListGroupsInput{})
for _, g := range groups.Groups {
    fmt.Println(*g.GroupName)
}

// Create group
client.CreateGroup(ctx, &iam.CreateGroupInput{GroupName: aws.String("developers")})

// Add user to group
client.AddUserToGroup(ctx, &iam.AddUserToGroupInput{
    UserName:  aws.String("alice"),
    GroupName: aws.String("developers"),
})`
    },
  ]
  })

  return {
    users,
    roles,
    policies,
    groups,
    loading,
    userAccessKeysMap,
    rolePoliciesMap,
    groupUsersMap,
    policyDocuments,
    codeExamples,
    expandedUsers,
    expandedRoles,
    expandedPolicies,
    expandedGroups,
    loadUsers,
    createUser,
    deleteUser,
    loadUserAccessKeys,
    createAccessKey,
    deleteAccessKey,
    loadRoles,
    createRole,
    deleteRole,
    loadRolePolicies,
    loadAllPolicies,
    attachPolicy,
    detachPolicy,
    loadPolicies,
    loadPolicyDocument,
    deletePolicy,
    createPolicy,
    loadGroups,
    createGroup,
    deleteGroup,
    loadGroupUsers,
    addUserToGroup,
    removeUserFromGroup,
    formatDate,
    loadAll,
  }
}