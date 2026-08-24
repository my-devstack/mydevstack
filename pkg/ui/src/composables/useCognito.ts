import { ref, computed } from 'vue'
import { useToast } from '@/composables/useToast'
import { useSettingsStore } from '@/stores/settings'
import type { CognitoUserPool, CognitoUser, CognitoGroup, CognitoUserPoolClient, CognitoResourceServer, CognitoAttribute } from '@/api/services/cognito'
import * as cognitoApi from '@/api/services/cognito'

export function useCognito() {
  const toast = useToast()

  const userPools = ref<CognitoUserPool[]>([])
  const users = ref<CognitoUser[]>([])
  const groups = ref<CognitoGroup[]>([])
  const userPoolClients = ref<CognitoUserPoolClient[]>([])
  const resourceServers = ref<CognitoResourceServer[]>([])
  const loading = ref(false)

  async function loadUserPools() {
    loading.value = true
    try {
      const result = await cognitoApi.listUserPools()
      userPools.value = result.UserPools as CognitoUserPool[]
    } catch (error) {
      toast.error('Failed to load user pools: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createUserPool(poolName: string) {
    await cognitoApi.createUserPool({ PoolName: poolName })
    toast.success(`User pool "${poolName}" created successfully`)
    await loadUserPools()
  }

  async function deleteUserPool(userPoolId: string) {
    await cognitoApi.deleteUserPool(userPoolId)
    toast.success(`User pool "${userPoolId}" deleted successfully`)
    await loadUserPools()
  }

  async function updateUserPool(userPoolId: string, params: { PoolName?: string; MfaConfiguration?: string; DeletionProtection?: string }) {
    await cognitoApi.updateUserPool(userPoolId, params)
    toast.success(`User pool updated successfully`)
    await loadUserPools()
  }

  async function loadUsers(userPoolId: string) {
    loading.value = true
    try {
      const result = await cognitoApi.listUsers(userPoolId)
      users.value = result.Users as CognitoUser[]
    } catch (error) {
      toast.error('Failed to load users: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createUser(
    userPoolId: string,
    username: string,
    temporaryPassword?: string,
    userAttributes?: CognitoAttribute[]
  ) {
    await cognitoApi.createUser(userPoolId, {
      Username: username,
      TemporaryPassword: temporaryPassword,
      UserAttributes: userAttributes,
    })
    toast.success(`User "${username}" created successfully`)
    await loadUsers(userPoolId)
  }

  async function deleteUser(userPoolId: string, username: string) {
    await cognitoApi.deleteUser(userPoolId, username)
    toast.success(`User "${username}" deleted successfully`)
    await loadUsers(userPoolId)
  }

  async function updateUser(userPoolId: string, username: string, userAttributes: CognitoAttribute[]) {
    await cognitoApi.updateUser(userPoolId, username, { UserAttributes: userAttributes })
    toast.success(`User "${username}" updated successfully`)
    await loadUsers(userPoolId)
  }

  async function loadGroups(userPoolId: string) {
    loading.value = true
    try {
      const result = await cognitoApi.listGroups(userPoolId)
      groups.value = result.Groups as CognitoGroup[]
    } catch (error) {
      toast.error('Failed to load groups: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createGroup(userPoolId: string, groupName: string, description?: string) {
    await cognitoApi.createGroup(userPoolId, { GroupName: groupName, Description: description })
    toast.success(`Group "${groupName}" created successfully`)
    await loadGroups(userPoolId)
  }

  async function deleteGroup(userPoolId: string, groupName: string) {
    await cognitoApi.deleteGroup(userPoolId, groupName)
    toast.success(`Group "${groupName}" deleted successfully`)
    await loadGroups(userPoolId)
  }

  async function updateGroup(userPoolId: string, groupName: string, params: { Description?: string; RoleArn?: string; Precedence?: number }) {
    await cognitoApi.updateGroup(userPoolId, groupName, params)
    toast.success(`Group "${groupName}" updated successfully`)
    await loadGroups(userPoolId)
  }

  async function loadUserPoolClients(userPoolId: string) {
    loading.value = true
    try {
      const result = await cognitoApi.listUserPoolClients(userPoolId)
      userPoolClients.value = result.UserPoolClients as CognitoUserPoolClient[]
    } catch (error) {
      toast.error('Failed to load user pool clients: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createUserPoolClient(userPoolId: string, clientName: string, generateSecret?: boolean) {
    await cognitoApi.createUserPoolClient(userPoolId, { ClientName: clientName, GenerateSecret: generateSecret })
    toast.success(`User pool client "${clientName}" created successfully`)
    await loadUserPoolClients(userPoolId)
  }

  async function deleteUserPoolClient(userPoolId: string, clientId: string) {
    await cognitoApi.deleteUserPoolClient(userPoolId, clientId)
    toast.success(`User pool client "${clientId}" deleted successfully`)
    await loadUserPoolClients(userPoolId)
  }

  async function updateUserPoolClient(userPoolId: string, clientId: string, params: { ClientName?: string; RefreshTokenValidity?: number; AccessTokenValidity?: number; IdTokenValidity?: number }) {
    await cognitoApi.updateUserPoolClient(userPoolId, clientId, params)
    toast.success(`User pool client updated successfully`)
    await loadUserPoolClients(userPoolId)
  }

  async function addUserToGroup(userPoolId: string, username: string, groupName: string) {
    await cognitoApi.addUserToGroup(userPoolId, username, groupName)
    toast.success(`User "${username}" added to group "${groupName}" successfully`)
  }

  async function removeUserFromGroup(userPoolId: string, username: string, groupName: string) {
    await cognitoApi.removeUserFromGroup(userPoolId, username, groupName)
    toast.success(`User "${username}" removed from group "${groupName}" successfully`)
  }

  async function listGroupsForUser(userPoolId: string, username: string): Promise<CognitoGroup[]> {
    const result = await cognitoApi.listGroupsForUser(userPoolId, username)
    return result.Groups as CognitoGroup[]
  }

  async function listUsersInGroup(userPoolId: string, groupName: string): Promise<CognitoUser[]> {
    const result = await cognitoApi.listUsersInGroup(userPoolId, groupName)
    return result.Users as CognitoUser[]
  }

  async function resetUserPassword(userPoolId: string, username: string, password: string, permanent: boolean) {
    await cognitoApi.adminSetUserPassword(userPoolId, username, password, permanent)
    toast.success(`Password for user "${username}" reset successfully`)
  }

  async function loadResourceServers(userPoolId: string) {
    loading.value = true
    try {
      const result = await cognitoApi.listResourceServers(userPoolId)
      resourceServers.value = result.ResourceServers as CognitoResourceServer[]
    } catch (error) {
      toast.error('Failed to load resource servers: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      loading.value = false
    }
  }

  async function createResourceServer(userPoolId: string, identifier: string, name: string) {
    await cognitoApi.createResourceServer(userPoolId, { Identifier: identifier, Name: name })
    toast.success(`Resource server "${name}" created successfully`)
    await loadResourceServers(userPoolId)
  }

  async function deleteResourceServer(userPoolId: string, identifier: string) {
    await cognitoApi.deleteResourceServer(userPoolId, identifier)
    toast.success(`Resource server "${identifier}" deleted successfully`)
    await loadResourceServers(userPoolId)
  }

  async function loadTags(userPoolId: string): Promise<Record<string, string>> {
    const result = await cognitoApi.listTagsForResource(userPoolId)
    return result.Tags
  }

  async function updateTags(userPoolId: string, tags: Record<string, string>, removedKeys: string[]) {
    await cognitoApi.updateTags(userPoolId, tags, removedKeys)
    toast.success('Tags updated successfully')
  }

  async function testUserLogin(userPoolId: string, username: string, password: string, clientId?: string): Promise<any> {
    if (!clientId) {
      throw new Error('A client ID is required to test login')
    }
    const result = await cognitoApi.adminInitiateAuth(userPoolId, clientId, 'ADMIN_USER_PASSWORD_AUTH', {
      USERNAME: username,
      PASSWORD: password,
    })
    return result
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  async function loadAll() {
    await Promise.all([loadUserPools()])
  }

  // Code examples
  const codeExamples = computed(() => {
    const settingsStore = useSettingsStore()
    return [
    {
      language: 'aws-cli',
      label: 'AWS CLI',
      code: `# List user pools
aws cognito-idp list-user-pools --max-results 20 --endpoint-url http://127.0.0.1:4566

# Create user pool
aws cognito-idp create-user-pool \\
  --pool-name my-pool \\
  --endpoint-url http://127.0.0.1:4566

# Delete user pool
aws cognito-idp delete-user-pool \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Update user pool
aws cognito-idp update-user-pool \\
  --user-pool-id us-east-1_abc123 \\
  --pool-name renamed-pool \\
  --mfa-configuration ON \\
  --deletion-protection ACTIVE \\
  --endpoint-url http://127.0.0.1:4566

# List users in a pool
aws cognito-idp list-users \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Create user
aws cognito-idp admin-create-user \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --temporary-password 'Temp123!' \\
  --user-attributes Name=email,Value=alice@example.com \\
  --endpoint-url http://127.0.0.1:4566

# Delete user
aws cognito-idp admin-delete-user \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --endpoint-url http://127.0.0.1:4566

# Update user attributes
aws cognito-idp admin-update-user-attributes \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --user-attributes Name=email,Value=new@example.com \\
  --endpoint-url http://127.0.0.1:4566

# List groups
aws cognito-idp list-groups \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Create group
aws cognito-idp create-group \\
  --user-pool-id us-east-1_abc123 \\
  --group-name admins \\
  --description 'Admin group' \\
  --endpoint-url http://127.0.0.1:4566

# Delete group
aws cognito-idp delete-group \\
  --user-pool-id us-east-1_abc123 \\
  --group-name admins \\
  --endpoint-url http://127.0.0.1:4566

# Update group
aws cognito-idp update-group \\
  --user-pool-id us-east-1_abc123 \\
  --group-name admins \\
  --description 'Updated admin group' \\
  --precedence 5 \\
  --endpoint-url http://127.0.0.1:4566

# List user pool clients
aws cognito-idp list-user-pool-clients \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Create user pool client
aws cognito-idp create-user-pool-client \\
  --user-pool-id us-east-1_abc123 \\
  --client-name web-app \\
  --generate-secret \\
  --endpoint-url http://127.0.0.1:4566

# Update user pool client
aws cognito-idp update-user-pool-client \\
  --user-pool-id us-east-1_abc123 \\
  --client-id client-1 \\
  --client-name web-app \\
  --refresh-token-validity 30 \\
  --endpoint-url http://127.0.0.1:4566

# Add user to group
aws cognito-idp admin-add-user-to-group \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --group-name admins \\
  --endpoint-url http://127.0.0.1:4566

# Remove user from group
aws cognito-idp admin-remove-user-from-group \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --group-name admins \\
  --endpoint-url http://127.0.0.1:4566

# List groups for user
aws cognito-idp admin-list-groups-for-user \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --endpoint-url http://127.0.0.1:4566

# List users in group
aws cognito-idp list-users-in-group \\
  --user-pool-id us-east-1_abc123 \\
  --group-name admins \\
  --endpoint-url http://127.0.0.1:4566

# Set user password
aws cognito-idp admin-set-user-password \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --password 'NewPass123!' \\
  --permanent \\
  --endpoint-url http://127.0.0.1:4566

# List resource servers
aws cognito-idp list-resource-servers \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Create resource server
aws cognito-idp create-resource-server \\
  --user-pool-id us-east-1_abc123 \\
  --identifier api.example.com \\
  --name 'API Server' \\
  --endpoint-url http://127.0.0.1:4566

# List tags
aws cognito-idp list-tags-for-resource \\
  --resource-arn us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Admin initiate auth (test login)
aws cognito-idp admin-initiate-auth \\
  --user-pool-id us-east-1_abc123 \\
  --client-id client-1 \\
  --auth-flow ADMIN_USER_PASSWORD_AUTH \\
  --auth-parameters USERNAME=alice,PASSWORD='Pass123!' \\
  --endpoint-url http://127.0.0.1:4566`
    },
    {
      language: 'javascript',
      label: 'JavaScript',
      code: `// Using AWS SDK v3
import { CognitoIdentityProviderClient, ListUserPoolsCommand, CreateUserPoolCommand, DeleteUserPoolCommand, UpdateUserPoolCommand, ListUsersCommand, AdminCreateUserCommand, AdminDeleteUserCommand, AdminUpdateUserAttributesCommand, ListGroupsCommand, CreateGroupCommand, DeleteGroupCommand, UpdateGroupCommand, ListUserPoolClientsCommand, CreateUserPoolClientCommand, UpdateUserPoolClientCommand, AdminAddUserToGroupCommand, AdminRemoveUserFromGroupCommand, AdminListGroupsForUserCommand, ListUsersInGroupCommand, AdminSetUserPasswordCommand, ListResourceServersCommand, CreateResourceServerCommand, ListTagsForResourceCommand, AdminInitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  region: '${settingsStore.region}',
  endpoint: 'http://127.0.0.1:4566',
  credentials: {
    accessKeyId: '${settingsStore.accessKey}',
    secretAccessKey: '${settingsStore.secretKey}',
  },
});

// List user pools
const pools = await client.send(new ListUserPoolsCommand({ MaxResults: 20 }));
console.log(pools.UserPools);

// Create user pool
const pool = await client.send(new CreateUserPoolCommand({ PoolName: 'my-pool' }));
console.log(pool.UserPool.Id);

// Delete user pool
await client.send(new DeleteUserPoolCommand({ UserPoolId: 'us-east-1_abc123' }));

// Update user pool
await client.send(new UpdateUserPoolCommand({
  UserPoolId: 'us-east-1_abc123',
  PoolName: 'renamed-pool',
  MfaConfiguration: 'ON',
  DeletionProtection: 'ACTIVE',
}));

// List users
const users = await client.send(new ListUsersCommand({ UserPoolId: 'us-east-1_abc123' }));
console.log(users.Users);

// Create user
await client.send(new AdminCreateUserCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
  TemporaryPassword: 'Temp123!',
  UserAttributes: [{ Name: 'email', Value: 'alice@example.com' }],
}));

// Delete user
await client.send(new AdminDeleteUserCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
}));

// Update user attributes
await client.send(new AdminUpdateUserAttributesCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
  UserAttributes: [{ Name: 'email', Value: 'new@example.com' }],
}));

// List groups
const groups = await client.send(new ListGroupsCommand({ UserPoolId: 'us-east-1_abc123' }));
console.log(groups.Groups);

// Create group
await client.send(new CreateGroupCommand({
  UserPoolId: 'us-east-1_abc123',
  GroupName: 'admins',
  Description: 'Admin group',
}));

// Delete group
await client.send(new DeleteGroupCommand({
  UserPoolId: 'us-east-1_abc123',
  GroupName: 'admins',
}));

// Update group
await client.send(new UpdateGroupCommand({
  UserPoolId: 'us-east-1_abc123',
  GroupName: 'admins',
  Description: 'Updated admin group',
  Precedence: 5,
}));

// List user pool clients
const clients = await client.send(new ListUserPoolClientsCommand({ UserPoolId: 'us-east-1_abc123' }));
console.log(clients.UserPoolClients);

// Create user pool client
await client.send(new CreateUserPoolClientCommand({
  UserPoolId: 'us-east-1_abc123',
  ClientName: 'web-app',
  GenerateSecret: true,
}));

// Update user pool client
await client.send(new UpdateUserPoolClientCommand({
  UserPoolId: 'us-east-1_abc123',
  ClientId: 'client-1',
  ClientName: 'web-app',
  RefreshTokenValidity: 30,
}));

// Add user to group
await client.send(new AdminAddUserToGroupCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
  GroupName: 'admins',
}));

// Remove user from group
await client.send(new AdminRemoveUserFromGroupCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
  GroupName: 'admins',
}));

// List groups for user
const userGroups = await client.send(new AdminListGroupsForUserCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
}));
console.log(userGroups.Groups);

// List users in group
const groupUsers = await client.send(new ListUsersInGroupCommand({
  UserPoolId: 'us-east-1_abc123',
  GroupName: 'admins',
}));
console.log(groupUsers.Users);

// Set user password
await client.send(new AdminSetUserPasswordCommand({
  UserPoolId: 'us-east-1_abc123',
  Username: 'alice',
  Password: 'NewPass123!',
  Permanent: true,
}));

// List resource servers
const servers = await client.send(new ListResourceServersCommand({ UserPoolId: 'us-east-1_abc123' }));
console.log(servers.ResourceServers);

// Create resource server
await client.send(new CreateResourceServerCommand({
  UserPoolId: 'us-east-1_abc123',
  Identifier: 'api.example.com',
  Name: 'API Server',
}));

// List tags
const tags = await client.send(new ListTagsForResourceCommand({ ResourceArn: 'us-east-1_abc123' }));
console.log(tags.Tags);

// Admin initiate auth (test login)
const auth = await client.send(new AdminInitiateAuthCommand({
  UserPoolId: 'us-east-1_abc123',
  ClientId: 'client-1',
  AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
  AuthParameters: { USERNAME: 'alice', PASSWORD: 'Pass123!' },
}));
console.log(auth.AuthenticationResult);`
    },
    {
      language: 'python',
      label: 'Python',
      code: `# Using boto3
import boto3

client = boto3.client(
    'cognito-idp',
    region_name='${settingsStore.region}',
    endpoint_url='http://127.0.0.1:4566',
    aws_access_key_id='${settingsStore.accessKey}',
    aws_secret_access_key='${settingsStore.secretKey}',
)

# List user pools
response = client.list_user_pools(MaxResults=20)
for pool in response['UserPools']:
    print(pool['Name'])

# Create user pool
response = client.create_user_pool(PoolName='my-pool')
print(response['UserPool']['Id'])

# Delete user pool
client.delete_user_pool(UserPoolId='us-east-1_abc123')

# Update user pool
client.update_user_pool(
    UserPoolId='us-east-1_abc123',
    PoolName='renamed-pool',
    MfaConfiguration='ON',
    DeletionProtection='ACTIVE',
)

# List users
response = client.list_users(UserPoolId='us-east-1_abc123')
for user in response['Users']:
    print(user['Username'])

# Create user
client.admin_create_user(
    UserPoolId='us-east-1_abc123',
    Username='alice',
    TemporaryPassword='Temp123!',
    UserAttributes=[{'Name': 'email', 'Value': 'alice@example.com'}],
)

# Delete user
client.admin_delete_user(UserPoolId='us-east-1_abc123', Username='alice')

# Update user attributes
client.admin_update_user_attributes(
    UserPoolId='us-east-1_abc123',
    Username='alice',
    UserAttributes=[{'Name': 'email', 'Value': 'new@example.com'}],
)

# List groups
response = client.list_groups(UserPoolId='us-east-1_abc123')
for group in response['Groups']:
    print(group['GroupName'])

# Create group
client.create_group(
    UserPoolId='us-east-1_abc123',
    GroupName='admins',
    Description='Admin group',
)

# Delete group
client.delete_group(UserPoolId='us-east-1_abc123', GroupName='admins')

# Update group
client.update_group(
    UserPoolId='us-east-1_abc123',
    GroupName='admins',
    Description='Updated admin group',
    Precedence=5,
)

# List user pool clients
response = client.list_user_pool_clients(UserPoolId='us-east-1_abc123')
for client_desc in response['UserPoolClients']:
    print(client_desc['ClientName'])

# Create user pool client
client.create_user_pool_client(
    UserPoolId='us-east-1_abc123',
    ClientName='web-app',
    GenerateSecret=True,
)

# Update user pool client
client.update_user_pool_client(
    UserPoolId='us-east-1_abc123',
    ClientId='client-1',
    ClientName='web-app',
    RefreshTokenValidity=30,
)

# Add user to group
client.admin_add_user_to_group(
    UserPoolId='us-east-1_abc123',
    Username='alice',
    GroupName='admins',
)

# Remove user from group
client.admin_remove_user_from_group(
    UserPoolId='us-east-1_abc123',
    Username='alice',
    GroupName='admins',
)

# List groups for user
response = client.admin_list_groups_for_user(
    UserPoolId='us-east-1_abc123',
    Username='alice',
)
for group in response['Groups']:
    print(group['GroupName'])

# List users in group
response = client.list_users_in_group(
    UserPoolId='us-east-1_abc123',
    GroupName='admins',
)
for user in response['Users']:
    print(user['Username'])

# Set user password
client.admin_set_user_password(
    UserPoolId='us-east-1_abc123',
    Username='alice',
    Password='NewPass123!',
    Permanent=True,
)

# List resource servers
response = client.list_resource_servers(UserPoolId='us-east-1_abc123')
for server in response['ResourceServers']:
    print(server['Name'])

# Create resource server
client.create_resource_server(
    UserPoolId='us-east-1_abc123',
    Identifier='api.example.com',
    Name='API Server',
)

# List tags
response = client.list_tags_for_resource(ResourceArn='us-east-1_abc123')
print(response['Tags'])

# Admin initiate auth (test login)
response = client.admin_initiate_auth(
    UserPoolId='us-east-1_abc123',
    ClientId='client-1',
    AuthFlow='ADMIN_USER_PASSWORD_AUTH',
    AuthParameters={'USERNAME': 'alice', 'PASSWORD': 'Pass123!'},
)
print(response['AuthenticationResult'])`
    },
    {
      language: 'go',
      label: 'Go',
      code: `// Using AWS SDK for Go v2
import (
    "context"
    "fmt"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
)

cfg, _ := config.LoadDefaultConfig(context.Background(),
    config.WithRegion("${settingsStore.region}"),
)

client := cognitoidentityprovider.NewFromConfig(cfg, func(o *cognitoidentityprovider.Options) {
    o.BaseEndpoint = "http://127.0.0.1:4566"
})

ctx := context.Background()

// List user pools
pools, _ := client.ListUserPools(ctx, &cognitoidentityprovider.ListUserPoolsInput{MaxResults: aws.Int32(20)})
for _, p := range pools.UserPools {
    fmt.Println(*p.Name)
}

// Create user pool
pool, _ := client.CreateUserPool(ctx, &cognitoidentityprovider.CreateUserPoolInput{PoolName: aws.String("my-pool")})
fmt.Println(*pool.UserPool.Id)

// Delete user pool
client.DeleteUserPool(ctx, &cognitoidentityprovider.DeleteUserPoolInput{UserPoolId: aws.String("us-east-1_abc123")})

// Update user pool
client.UpdateUserPool(ctx, &cognitoidentityprovider.UpdateUserPoolInput{
    UserPoolId:          aws.String("us-east-1_abc123"),
    PoolName:            aws.String("renamed-pool"),
    MfaConfiguration:    types.UserPoolMfaType("ON"),
    DeletionProtection:  types.DeletionProtectionType("ACTIVE"),
})

// List users
users, _ := client.ListUsers(ctx, &cognitoidentityprovider.ListUsersInput{UserPoolId: aws.String("us-east-1_abc123")})
for _, u := range users.Users {
    fmt.Println(*u.Username)
}

// Create user
client.AdminCreateUser(ctx, &cognitoidentityprovider.AdminCreateUserInput{
    UserPoolId:        aws.String("us-east-1_abc123"),
    Username:          aws.String("alice"),
    TemporaryPassword: aws.String("Temp123!"),
    UserAttributes: []types.AttributeType{
        {Name: aws.String("email"), Value: aws.String("alice@example.com")},
    },
})

// Delete user
client.AdminDeleteUser(ctx, &cognitoidentityprovider.AdminDeleteUserInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Username:   aws.String("alice"),
})

// Update user attributes
client.AdminUpdateUserAttributes(ctx, &cognitoidentityprovider.AdminUpdateUserAttributesInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Username:   aws.String("alice"),
    UserAttributes: []types.AttributeType{
        {Name: aws.String("email"), Value: aws.String("new@example.com")},
    },
})

// List groups
groups, _ := client.ListGroups(ctx, &cognitoidentityprovider.ListGroupsInput{UserPoolId: aws.String("us-east-1_abc123")})
for _, g := range groups.Groups {
    fmt.Println(*g.GroupName)
}

// Create group
client.CreateGroup(ctx, &cognitoidentityprovider.CreateGroupInput{
    UserPoolId:  aws.String("us-east-1_abc123"),
    GroupName:   aws.String("admins"),
    Description: aws.String("Admin group"),
})

// Delete group
client.DeleteGroup(ctx, &cognitoidentityprovider.DeleteGroupInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    GroupName:  aws.String("admins"),
})

// Update group
client.UpdateGroup(ctx, &cognitoidentityprovider.UpdateGroupInput{
    UserPoolId:  aws.String("us-east-1_abc123"),
    GroupName:   aws.String("admins"),
    Description: aws.String("Updated admin group"),
    Precedence:  aws.Int32(5),
})

// List user pool clients
clients, _ := client.ListUserPoolClients(ctx, &cognitoidentityprovider.ListUserPoolClientsInput{UserPoolId: aws.String("us-east-1_abc123")})
for _, c := range clients.UserPoolClients {
    fmt.Println(*c.ClientName)
}

// Create user pool client
client.CreateUserPoolClient(ctx, &cognitoidentityprovider.CreateUserPoolClientInput{
    UserPoolId:     aws.String("us-east-1_abc123"),
    ClientName:     aws.String("web-app"),
    GenerateSecret: aws.Bool(true),
})

// Update user pool client
client.UpdateUserPoolClient(ctx, &cognitoidentityprovider.UpdateUserPoolClientInput{
    UserPoolId:           aws.String("us-east-1_abc123"),
    ClientId:             aws.String("client-1"),
    ClientName:           aws.String("web-app"),
    RefreshTokenValidity: aws.Int32(30),
})

// Add user to group
client.AdminAddUserToGroup(ctx, &cognitoidentityprovider.AdminAddUserToGroupInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Username:   aws.String("alice"),
    GroupName:  aws.String("admins"),
})

// Remove user from group
client.AdminRemoveUserFromGroup(ctx, &cognitoidentityprovider.AdminRemoveUserFromGroupInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Username:   aws.String("alice"),
    GroupName:  aws.String("admins"),
})

// List groups for user
userGroups, _ := client.AdminListGroupsForUser(ctx, &cognitoidentityprovider.AdminListGroupsForUserInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Username:   aws.String("alice"),
})
for _, g := range userGroups.Groups {
    fmt.Println(*g.GroupName)
}

// List users in group
groupUsers, _ := client.ListUsersInGroup(ctx, &cognitoidentityprovider.ListUsersInGroupInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    GroupName:  aws.String("admins"),
})
for _, u := range groupUsers.Users {
    fmt.Println(*u.Username)
}

// Set user password
client.AdminSetUserPassword(ctx, &cognitoidentityprovider.AdminSetUserPasswordInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Username:   aws.String("alice"),
    Password:   aws.String("NewPass123!"),
    Permanent:  aws.Bool(true),
})

// List resource servers
servers, _ := client.ListResourceServers(ctx, &cognitoidentityprovider.ListResourceServersInput{UserPoolId: aws.String("us-east-1_abc123")})
for _, s := range servers.ResourceServers {
    fmt.Println(*s.Name)
}

// Create resource server
client.CreateResourceServer(ctx, &cognitoidentityprovider.CreateResourceServerInput{
    UserPoolId: aws.String("us-east-1_abc123"),
    Identifier: aws.String("api.example.com"),
    Name:       aws.String("API Server"),
})

// List tags
tags, _ := client.ListTagsForResource(ctx, &cognitoidentityprovider.ListTagsForResourceInput{ResourceArn: aws.String("us-east-1_abc123")})
fmt.Println(tags.Tags)

// Admin initiate auth (test login)
auth, _ := client.AdminInitiateAuth(ctx, &cognitoidentityprovider.AdminInitiateAuthInput{
    UserPoolId:     aws.String("us-east-1_abc123"),
    ClientId:       aws.String("client-1"),
    AuthFlow:       types.AuthFlowType("ADMIN_USER_PASSWORD_AUTH"),
    AuthParameters: map[string]string{"USERNAME": "alice", "PASSWORD": "Pass123!"},
})
fmt.Println(auth.AuthenticationResult)`
    },
  ]
  })

  return {
    userPools,
    users,
    groups,
    userPoolClients,
    resourceServers,
    loading,
    codeExamples,
    loadUserPools,
    createUserPool,
    deleteUserPool,
    updateUserPool,
    loadUsers,
    createUser,
    deleteUser,
    updateUser,
    loadGroups,
    createGroup,
    deleteGroup,
    updateGroup,
    loadUserPoolClients,
    createUserPoolClient,
    deleteUserPoolClient,
    updateUserPoolClient,
    addUserToGroup,
    removeUserFromGroup,
    listGroupsForUser,
    listUsersInGroup,
    resetUserPassword,
    loadResourceServers,
    createResourceServer,
    deleteResourceServer,
    loadTags,
    updateTags,
    testUserLogin,
    formatDate,
    loadAll,
  }
}