<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { useToast } from '@/composables/useToast'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Tabs from '@/components/common/Tabs.vue'
import CodeSnippet from '@/components/common/CodeSnippet.vue'
import {
  CloudIcon,
  UserIcon,
  UserGroupIcon,
  KeyIcon,
  ServerIcon,
  PlusIcon,
} from '@heroicons/vue/24/outline'
import {
  CognitoUserPoolList,
  CognitoCreateUserPoolModal,
  CognitoDeleteUserPoolModal,
  CognitoEditUserPoolModal,
  CognitoUserList,
  CognitoCreateUserModal,
  CognitoDeleteUserModal,
  CognitoEditUserModal,
  CognitoGroupList,
  CognitoCreateGroupModal,
  CognitoDeleteGroupModal,
  CognitoEditGroupModal,
  CognitoUserPoolClientList,
  CognitoCreateUserPoolClientModal,
  CognitoEditUserPoolClientModal,
  CognitoDeleteUserPoolClientModal,
  CognitoResourceServerList,
  CognitoCreateResourceServerModal,
  CognitoDeleteResourceServerModal,
  CognitoGroupMembersModal,
  CognitoResetPasswordModal,
  CognitoTestLoginModal,
} from '@/components/cognito'
import {
  listUserPools,
  createUserPool,
  deleteUserPool,
  updateUserPool,
  listUsers,
  createUser,
  deleteUser,
  updateUser,
  listGroups,
  createGroup,
  deleteGroup,
  updateGroup,
  listUserPoolClients,
  createUserPoolClient,
  deleteUserPoolClient,
  updateUserPoolClient,
  listResourceServers,
  createResourceServer,
  deleteResourceServer,
  listUsersInGroup,
  addUserToGroup,
  removeUserFromGroup,
  adminSetUserPassword,
  adminInitiateAuth,
  listTagsForResource,
  updateTags,
} from '@/api/services/cognito'
import type {
  CognitoUserPool,
  CognitoUser,
  CognitoGroup,
  CognitoUserPoolClient,
  CognitoResourceServer,
} from '@/api/services/cognito'

// Components
const settingsStore = useSettingsStore()
const toast = useToast()
const { reloadTrigger } = useContentReload()

// State
const activeTab = ref('pools')
const isLoading = ref(false)

// User pools
const userPools = ref<CognitoUserPool[]>([])
const poolToDelete = ref<CognitoUserPool | null>(null)
const poolToEdit = ref<CognitoUserPool | null>(null)
const poolTags = ref<Record<string, string>>({})
const showCreateUserPoolModal = ref(false)
const showDeleteUserPoolModal = ref(false)
const showEditUserPoolModal = ref(false)
const userPoolsError = ref('')

// Users
const users = ref<CognitoUser[]>([])
const userToDelete = ref<string | null>(null)
const userToEdit = ref<CognitoUser | null>(null)
const showCreateUserModal = ref(false)
const showDeleteUserModal = ref(false)
const showEditUserModal = ref(false)
const usersError = ref('')

// Groups
const groups = ref<CognitoGroup[]>([])
const groupToDelete = ref<string | null>(null)
const groupToEdit = ref<CognitoGroup | null>(null)
const showCreateGroupModal = ref(false)
const showDeleteGroupModal = ref(false)
const showEditGroupModal = ref(false)
const groupsError = ref('')

// User pool clients
const userPoolClients = ref<CognitoUserPoolClient[]>([])
const clientToDelete = ref<string | null>(null)
const clientToEdit = ref<CognitoUserPoolClient | null>(null)
const showCreateUserPoolClientModal = ref(false)
const showEditUserPoolClientModal = ref(false)
const showDeleteUserPoolClientModal = ref(false)
const userPoolClientsError = ref('')

// Resource servers
const resourceServers = ref<CognitoResourceServer[]>([])
const resourceServerToDelete = ref<string | null>(null)
const showCreateResourceServerModal = ref(false)
const showDeleteResourceServerModal = ref(false)
const resourceServersError = ref('')

// Group members
const groupForMembers = ref<CognitoGroup | null>(null)
const groupMembers = ref<CognitoUser[]>([])
const groupMembersLoading = ref(false)
const showGroupMembersModal = ref(false)

// Reset password
const userForPassword = ref<string | null>(null)
const showResetPasswordModal = ref(false)

// Test login
const userForLogin = ref<string | null>(null)
const showTestLoginModal = ref(false)
const authResult = ref<any>(null)

// Selected user pool for users/groups/clients/resource-servers tabs
const selectedUserPoolId = ref('')

// Tabs
const tabs = [
  { id: 'pools', label: 'User Pools', icon: CloudIcon },
  { id: 'users', label: 'Users', icon: UserIcon },
  { id: 'groups', label: 'Groups', icon: UserGroupIcon },
  { id: 'clients', label: 'Clients', icon: KeyIcon },
  { id: 'resource-servers', label: 'Resource Servers', icon: ServerIcon },
]

// Computed
const userPoolCount = computed(() => userPools.value.length)
const userCount = computed(() => users.value.length)
const groupCount = computed(() => groups.value.length)
const clientCount = computed(() => userPoolClients.value.length)
const resourceServerCount = computed(() => resourceServers.value.length)

const selectedUserPool = computed(() =>
  userPools.value.find((p) => p.Id === selectedUserPoolId.value) || null
)

// Code examples
const codeExamples = [
  {
    language: 'aws-cli',
    label: 'AWS CLI',
    code: `# List user pools
aws cognito-idp list-user-pools --max-results 20 --endpoint-url http://127.0.0.1:4566

# Create user pool
aws cognito-idp create-user-pool \\
  --pool-name my-user-pool \\
  --endpoint-url http://127.0.0.1:4566

# Delete user pool
aws cognito-idp delete-user-pool \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# List users in a pool
aws cognito-idp list-users \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Create user
aws cognito-idp admin-create-user \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --temporary-password TempPass123! \\
  --endpoint-url http://127.0.0.1:4566

# Delete user
aws cognito-idp admin-delete-user \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --endpoint-url http://127.0.0.1:4566

# List groups
aws cognito-idp list-groups \\
  --user-pool-id us-east-1_abc123 \\
  --endpoint-url http://127.0.0.1:4566

# Create group
aws cognito-idp create-group \\
  --user-pool-id us-east-1_abc123 \\
  --group-name developers \\
  --description "Developer group" \\
  --endpoint-url http://127.0.0.1:4566

# Delete group
aws cognito-idp delete-group \\
  --user-pool-id us-east-1_abc123 \\
  --group-name developers \\
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

# Add user to group
aws cognito-idp admin-add-user-to-group \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --group-name developers \\
  --endpoint-url http://127.0.0.1:4566

# Remove user from group
aws cognito-idp admin-remove-user-from-group \\
  --user-pool-id us-east-1_abc123 \\
  --username alice \\
  --group-name developers \\
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
  --endpoint-url http://127.0.0.1:4566`,
  },
  {
    language: 'javascript',
    label: 'JavaScript',
    code: `// Using AWS SDK v3
import {
  CognitoIdentityProviderClient,
  ListUserPoolsCommand,
  CreateUserPoolCommand,
  DeleteUserPoolCommand,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  ListGroupsCommand,
  CreateGroupCommand,
  DeleteGroupCommand,
  ListUserPoolClientsCommand,
  CreateUserPoolClientCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminSetUserPasswordCommand,
  ListResourceServersCommand,
  CreateResourceServerCommand,
  ListTagsForResourceCommand,
  AdminInitiateAuthCommand,
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({
  endpoint: "http://127.0.0.1:4566",
  region: "us-east-1",
  credentials: { accessKeyId: "test", secretAccessKey: "test" },
});

// List user pools
const pools = await client.send(new ListUserPoolsCommand({ MaxResults: 20 }));

// Create user pool
await client.send(new CreateUserPoolCommand({ PoolName: "my-user-pool" }));

// List users in a pool
const users = await client.send(
  new ListUsersCommand({ UserPoolId: "us-east-1_abc123" })
);

// Create user
await client.send(
  new AdminCreateUserCommand({
    UserPoolId: "us-east-1_abc123",
    Username: "alice",
    TemporaryPassword: "TempPass123!",
  })
);

// List groups
const groups = await client.send(
  new ListGroupsCommand({ UserPoolId: "us-east-1_abc123" })
);

// Create group
await client.send(
  new CreateGroupCommand({
    UserPoolId: "us-east-1_abc123",
    GroupName: "developers",
    Description: "Developer group",
  })
);

// List user pool clients
const clients = await client.send(
  new ListUserPoolClientsCommand({ UserPoolId: "us-east-1_abc123" })
);

// Create user pool client
await client.send(
  new CreateUserPoolClientCommand({
    UserPoolId: "us-east-1_abc123",
    ClientName: "web-app",
    GenerateSecret: true,
  })
);

// Add user to group
await client.send(
  new AdminAddUserToGroupCommand({
    UserPoolId: "us-east-1_abc123",
    Username: "alice",
    GroupName: "developers",
  })
);

// Remove user from group
await client.send(
  new AdminRemoveUserFromGroupCommand({
    UserPoolId: "us-east-1_abc123",
    Username: "alice",
    GroupName: "developers",
  })
);

// Set user password
await client.send(
  new AdminSetUserPasswordCommand({
    UserPoolId: "us-east-1_abc123",
    Username: "alice",
    Password: "NewPass123!",
    Permanent: true,
  })
);

// List resource servers
const servers = await client.send(
  new ListResourceServersCommand({ UserPoolId: "us-east-1_abc123" })
);

// Create resource server
await client.send(
  new CreateResourceServerCommand({
    UserPoolId: "us-east-1_abc123",
    Identifier: "api.example.com",
    Name: "API Server",
  })
);

// List tags
const tags = await client.send(
  new ListTagsForResourceCommand({ ResourceArn: "us-east-1_abc123" })
);

// Admin initiate auth (test login)
const auth = await client.send(
  new AdminInitiateAuthCommand({
    UserPoolId: "us-east-1_abc123",
    ClientId: "client-1",
    AuthFlow: "ADMIN_USER_PASSWORD_AUTH",
    AuthParameters: { USERNAME: "alice", PASSWORD: "Pass123!" },
  })
);`,
  },
  {
    language: 'python',
    label: 'Python',
    code: `# Using boto3
import boto3

client = boto3.client(
    "cognito-idp",
    endpoint_url="http://127.0.0.1:4566",
    region_name="us-east-1",
    aws_access_key_id="test",
    aws_secret_access_key="test",
)

# List user pools
pools = client.list_user_pools(MaxResults=20)

# Create user pool
client.create_user_pool(PoolName="my-user-pool")

# List users in a pool
users = client.list_users(UserPoolId="us-east-1_abc123")

# Create user
client.admin_create_user(
    UserPoolId="us-east-1_abc123",
    Username="alice",
    TemporaryPassword="TempPass123!",
)

# List groups
groups = client.list_groups(UserPoolId="us-east-1_abc123")

# Create group
client.create_group(
    UserPoolId="us-east-1_abc123",
    GroupName="developers",
    Description="Developer group",
)

# List user pool clients
clients = client.list_user_pool_clients(UserPoolId="us-east-1_abc123")

# Create user pool client
client.create_user_pool_client(
    UserPoolId="us-east-1_abc123",
    ClientName="web-app",
    GenerateSecret=True,
)

# Add user to group
client.admin_add_user_to_group(
    UserPoolId="us-east-1_abc123",
    Username="alice",
    GroupName="developers",
)

# Remove user from group
client.admin_remove_user_from_group(
    UserPoolId="us-east-1_abc123",
    Username="alice",
    GroupName="developers",
)

# Set user password
client.admin_set_user_password(
    UserPoolId="us-east-1_abc123",
    Username="alice",
    Password="NewPass123!",
    Permanent=True,
)

# List resource servers
servers = client.list_resource_servers(UserPoolId="us-east-1_abc123")

# Create resource server
client.create_resource_server(
    UserPoolId="us-east-1_abc123",
    Identifier="api.example.com",
    Name="API Server",
)

# List tags
tags = client.list_tags_for_resource(ResourceArn="us-east-1_abc123")

# Admin initiate auth (test login)
auth = client.admin_initiate_auth(
    UserPoolId="us-east-1_abc123",
    ClientId="client-1",
    AuthFlow="ADMIN_USER_PASSWORD_AUTH",
    AuthParameters={"USERNAME": "alice", "PASSWORD": "Pass123!"},
)`,
  },
  {
    language: 'go',
    label: 'Go',
    code: `// Using AWS SDK for Go v2
package main

import (
    "context"
    "fmt"

    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/service/cognitoidentityprovider"
)

func main() {
    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion("us-east-1"),
        config.WithEndpointResolverWithOptions(aws.EndpointResolverWithOptionsFunc(
            func(service, region string, options ...interface{}) (aws.Endpoint, error) {
                return aws.Endpoint{URL: "http://127.0.0.1:4566"}, nil
            },
        )),
    )
    if err != nil {
        panic(err)
    }

    client := cognitoidentityprovider.NewFromConfig(cfg)

    // List user pools
    pools, err := client.ListUserPools(context.TODO(), &cognitoidentityprovider.ListUserPoolsInput{
        MaxResults: aws.Int32(20),
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(pools)

    // Create user pool
    _, err = client.CreateUserPool(context.TODO(), &cognitoidentityprovider.CreateUserPoolInput{
        PoolName: aws.String("my-user-pool"),
    })
    if err != nil {
        panic(err)
    }

    // List users in a pool
    users, err := client.ListUsers(context.TODO(), &cognitoidentityprovider.ListUsersInput{
        UserPoolId: aws.String("us-east-1_abc123"),
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(users)

    // List groups
    groups, err := client.ListGroups(context.TODO(), &cognitoidentityprovider.ListGroupsInput{
        UserPoolId: aws.String("us-east-1_abc123"),
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(groups)

    // List user pool clients
    clients, err := client.ListUserPoolClients(context.TODO(), &cognitoidentityprovider.ListUserPoolClientsInput{
        UserPoolId: aws.String("us-east-1_abc123"),
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(clients)

    // Add user to group
    _, err = client.AdminAddUserToGroup(context.TODO(), &cognitoidentityprovider.AdminAddUserToGroupInput{
        UserPoolId: aws.String("us-east-1_abc123"),
        Username:   aws.String("alice"),
        GroupName:  aws.String("developers"),
    })
    if err != nil {
        panic(err)
    }

    // Set user password
    _, err = client.AdminSetUserPassword(context.TODO(), &cognitoidentityprovider.AdminSetUserPasswordInput{
        UserPoolId: aws.String("us-east-1_abc123"),
        Username:   aws.String("alice"),
        Password:   aws.String("NewPass123!"),
        Permanent:  aws.Bool(true),
    })
    if err != nil {
        panic(err)
    }

    // List resource servers
    servers, err := client.ListResourceServers(context.TODO(), &cognitoidentityprovider.ListResourceServersInput{
        UserPoolId: aws.String("us-east-1_abc123"),
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(servers)

    // Admin initiate auth (test login)
    auth, err := client.AdminInitiateAuth(context.TODO(), &cognitoidentityprovider.AdminInitiateAuthInput{
        UserPoolId:     aws.String("us-east-1_abc123"),
        ClientId:       aws.String("client-1"),
        AuthFlow:       "ADMIN_USER_PASSWORD_AUTH",
        AuthParameters: map[string]string{"USERNAME": "alice", "PASSWORD": "Pass123!"},
    })
    if err != nil {
        panic(err)
    }
    fmt.Println(auth)`,
  },
]

// User pool functions
async function loadUserPools() {
  isLoading.value = true
  userPoolsError.value = ''
  try {
    const result = await listUserPools()
    userPools.value = result.UserPools
  } catch (error) {
    userPoolsError.value = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to load user pools: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateUserPool(data: { PoolName: string }) {
  if (!data.PoolName.trim()) {
    toast.error('Pool name is required')
    return
  }

  try {
    await createUserPool({ PoolName: data.PoolName })
    toast.success(`User pool "${data.PoolName}" created successfully`)
    showCreateUserPoolModal.value = false
    await loadUserPools()
  } catch (error) {
    toast.error('Failed to create user pool: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteUserPool() {
  if (!poolToDelete.value) return

  const poolId = poolToDelete.value.Id
  try {
    await deleteUserPool(poolId)
    toast.success(`User pool "${poolToDelete.value.Name}" deleted successfully`)
    showDeleteUserPoolModal.value = false
    poolToDelete.value = null
    if (selectedUserPoolId.value === poolId) {
      selectedUserPoolId.value = ''
    }
    await loadUserPools()
  } catch (error) {
    toast.error('Failed to delete user pool: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function openEditUserPoolModal(pool: CognitoUserPool) {
  poolToEdit.value = pool
  poolTags.value = {}
  try {
    const result = await listTagsForResource(pool.Id)
    poolTags.value = result.Tags
  } catch (error) {
    toast.error('Failed to load tags: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
  showEditUserPoolModal.value = true
}

async function handleEditUserPool(userPoolId: string, data: { PoolName?: string; MfaConfiguration?: string; DeletionProtection?: string; Tags?: Record<string, string>; RemovedKeys?: string[] }) {
  if (!poolToEdit.value) return
  try {
    const { Tags, RemovedKeys, ...poolParams } = data
    await updateUserPool(poolToEdit.value.Id, poolParams)
    if (Tags !== undefined) {
      await updateTags(poolToEdit.value.Id, Tags, RemovedKeys || [])
    }
    toast.success('User pool updated successfully')
    showEditUserPoolModal.value = false
    poolToEdit.value = null
    await loadUserPools()
  } catch (error) {
    toast.error('Failed to update user pool: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// User functions
async function loadUsers() {
  if (!selectedUserPoolId.value) return
  isLoading.value = true
  usersError.value = ''
  try {
    const result = await listUsers(selectedUserPoolId.value)
    users.value = result.Users
  } catch (error) {
    usersError.value = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to load users: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateUser(data: { Username: string; TemporaryPassword?: string }) {
  if (!selectedUserPoolId.value) {
    toast.error('Select a user pool first')
    return
  }
  if (!data.Username.trim()) {
    toast.error('Username is required')
    return
  }

  try {
    await createUser(selectedUserPoolId.value, {
      Username: data.Username,
      TemporaryPassword: data.TemporaryPassword,
    })
    toast.success(`User "${data.Username}" created successfully`)
    showCreateUserModal.value = false
    await loadUsers()
  } catch (error) {
    toast.error('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteUser() {
  if (!selectedUserPoolId.value || !userToDelete.value) return

  const username = userToDelete.value
  try {
    await deleteUser(selectedUserPoolId.value, username)
    toast.success(`User "${username}" deleted successfully`)
    showDeleteUserModal.value = false
    userToDelete.value = null
    await loadUsers()
  } catch (error) {
    toast.error('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleEditUser(userPoolId: string, username: string, userAttributes: { Name: string; Value: string }[]) {
  try {
    await updateUser(userPoolId, username, { UserAttributes: userAttributes })
    toast.success(`User "${username}" updated successfully`)
    showEditUserModal.value = false
    userToEdit.value = null
    await loadUsers()
  } catch (error) {
    toast.error('Failed to update user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Group functions
async function loadGroups() {
  if (!selectedUserPoolId.value) return
  isLoading.value = true
  groupsError.value = ''
  try {
    const result = await listGroups(selectedUserPoolId.value)
    groups.value = result.Groups
  } catch (error) {
    groupsError.value = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to load groups: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateGroup(data: { GroupName: string; Description?: string }) {
  if (!selectedUserPoolId.value) {
    toast.error('Select a user pool first')
    return
  }
  if (!data.GroupName.trim()) {
    toast.error('Group name is required')
    return
  }

  try {
    await createGroup(selectedUserPoolId.value, {
      GroupName: data.GroupName,
      Description: data.Description,
    })
    toast.success(`Group "${data.GroupName}" created successfully`)
    showCreateGroupModal.value = false
    await loadGroups()
  } catch (error) {
    toast.error('Failed to create group: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteGroup() {
  if (!selectedUserPoolId.value || !groupToDelete.value) return

  const groupName = groupToDelete.value
  try {
    await deleteGroup(selectedUserPoolId.value, groupName)
    toast.success(`Group "${groupName}" deleted successfully`)
    showDeleteGroupModal.value = false
    groupToDelete.value = null
    await loadGroups()
  } catch (error) {
    toast.error('Failed to delete group: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleEditGroup(userPoolId: string, groupName: string, params: { Description?: string; RoleArn?: string; Precedence?: number }) {
  try {
    await updateGroup(userPoolId, groupName, params)
    toast.success(`Group "${groupName}" updated successfully`)
    showEditGroupModal.value = false
    groupToEdit.value = null
    await loadGroups()
  } catch (error) {
    toast.error('Failed to update group: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// User pool client functions
async function loadUserPoolClients() {
  if (!selectedUserPoolId.value) return
  isLoading.value = true
  userPoolClientsError.value = ''
  try {
    const result = await listUserPoolClients(selectedUserPoolId.value)
    userPoolClients.value = result.UserPoolClients
  } catch (error) {
    userPoolClientsError.value = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to load user pool clients: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateUserPoolClient(data: { ClientName: string; GenerateSecret?: boolean }) {
  if (!selectedUserPoolId.value) {
    toast.error('Select a user pool first')
    return
  }
  if (!data.ClientName.trim()) {
    toast.error('Client name is required')
    return
  }

  try {
    await createUserPoolClient(selectedUserPoolId.value, {
      ClientName: data.ClientName,
      GenerateSecret: data.GenerateSecret,
    })
    toast.success(`Client "${data.ClientName}" created successfully`)
    showCreateUserPoolClientModal.value = false
    await loadUserPoolClients()
  } catch (error) {
    toast.error('Failed to create client: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteUserPoolClient() {
  if (!selectedUserPoolId.value || !clientToDelete.value) return

  const clientId = clientToDelete.value
  try {
    await deleteUserPoolClient(selectedUserPoolId.value, clientId)
    toast.success(`Client "${clientId}" deleted successfully`)
    showDeleteUserPoolClientModal.value = false
    clientToDelete.value = null
    await loadUserPoolClients()
  } catch (error) {
    toast.error('Failed to delete client: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleEditUserPoolClient(userPoolId: string, clientId: string, params: { ClientName?: string; RefreshTokenValidity?: number; AccessTokenValidity?: number; IdTokenValidity?: number }) {
  try {
    await updateUserPoolClient(userPoolId, clientId, params)
    toast.success('Client updated successfully')
    showEditUserPoolClientModal.value = false
    clientToEdit.value = null
    await loadUserPoolClients()
  } catch (error) {
    toast.error('Failed to update client: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Resource server functions
async function loadResourceServers() {
  if (!selectedUserPoolId.value) return
  isLoading.value = true
  resourceServersError.value = ''
  try {
    const result = await listResourceServers(selectedUserPoolId.value)
    resourceServers.value = result.ResourceServers
  } catch (error) {
    resourceServersError.value = error instanceof Error ? error.message : 'Unknown error'
    toast.error('Failed to load resource servers: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateResourceServer(data: { Identifier: string; Name: string }) {
  if (!selectedUserPoolId.value) {
    toast.error('Select a user pool first')
    return
  }
  if (!data.Identifier.trim() || !data.Name.trim()) {
    toast.error('Identifier and name are required')
    return
  }

  try {
    await createResourceServer(selectedUserPoolId.value, {
      Identifier: data.Identifier,
      Name: data.Name,
    })
    toast.success(`Resource server "${data.Name}" created successfully`)
    showCreateResourceServerModal.value = false
    await loadResourceServers()
  } catch (error) {
    toast.error('Failed to create resource server: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteResourceServer() {
  if (!selectedUserPoolId.value || !resourceServerToDelete.value) return

  const identifier = resourceServerToDelete.value
  try {
    await deleteResourceServer(selectedUserPoolId.value, identifier)
    toast.success(`Resource server "${identifier}" deleted successfully`)
    showDeleteResourceServerModal.value = false
    resourceServerToDelete.value = null
    await loadResourceServers()
  } catch (error) {
    toast.error('Failed to delete resource server: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Group membership functions
async function handleOpenMembers(group: CognitoGroup) {
  if (!selectedUserPoolId.value) return
  groupForMembers.value = group
  groupMembers.value = []
  groupMembersLoading.value = true
  showGroupMembersModal.value = true
  try {
    const result = await listUsersInGroup(selectedUserPoolId.value, group.GroupName)
    groupMembers.value = result.Users
  } catch (error) {
    toast.error('Failed to load group members: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    groupMembersLoading.value = false
  }
}

async function handleAddUserToGroup(username: string) {
  if (!selectedUserPoolId.value || !groupForMembers.value) return
  try {
    await addUserToGroup(selectedUserPoolId.value, username, groupForMembers.value.GroupName)
    toast.success(`User "${username}" added to group "${groupForMembers.value.GroupName}" successfully`)
    await handleOpenMembers(groupForMembers.value)
  } catch (error) {
    toast.error('Failed to add user to group: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleRemoveUserFromGroup(username: string) {
  if (!selectedUserPoolId.value || !groupForMembers.value) return
  try {
    await removeUserFromGroup(selectedUserPoolId.value, username, groupForMembers.value.GroupName)
    toast.success(`User "${username}" removed from group "${groupForMembers.value.GroupName}" successfully`)
    await handleOpenMembers(groupForMembers.value)
  } catch (error) {
    toast.error('Failed to remove user from group: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Reset password
async function handleResetPassword(password: string, permanent: boolean) {
  if (!selectedUserPoolId.value || !userForPassword.value) return
  try {
    await adminSetUserPassword(selectedUserPoolId.value, userForPassword.value, password, permanent)
    toast.success(`Password for user "${userForPassword.value}" reset successfully`)
    showResetPasswordModal.value = false
    userForPassword.value = null
  } catch (error) {
    toast.error('Failed to reset password: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Test login
async function handleTestLogin(password: string, clientId?: string) {
  if (!selectedUserPoolId.value || !userForLogin.value) return
  if (!clientId) {
    toast.error('A client ID is required to test login')
    return
  }
  try {
    authResult.value = await adminInitiateAuth(selectedUserPoolId.value, clientId, 'ADMIN_USER_PASSWORD_AUTH', {
      USERNAME: userForLogin.value,
      PASSWORD: password,
    })
  } catch (error) {
    toast.error('Test login failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

// Tab switching
function handleTabChange(tabId: string) {
  activeTab.value = tabId
  if (tabId === 'users' || tabId === 'groups' || tabId === 'clients' || tabId === 'resource-servers') {
    if (!selectedUserPoolId.value && userPools.value.length > 0) {
      selectedUserPoolId.value = userPools.value[0].Id
    }
    if (selectedUserPoolId.value) {
      if (tabId === 'users') loadUsers()
      else if (tabId === 'groups') loadGroups()
      else if (tabId === 'clients') loadUserPoolClients()
      else loadResourceServers()
    }
  }
}

function handleUserPoolSelect() {
  if (!selectedUserPoolId.value) return
  if (activeTab.value === 'users') loadUsers()
  else if (activeTab.value === 'groups') loadGroups()
  else if (activeTab.value === 'clients') loadUserPoolClients()
  else if (activeTab.value === 'resource-servers') loadResourceServers()
}

// Create button per tab
function openCreateModal() {
  if (activeTab.value === 'pools') showCreateUserPoolModal.value = true
  else if (activeTab.value === 'users') showCreateUserModal.value = true
  else if (activeTab.value === 'groups') showCreateGroupModal.value = true
  else if (activeTab.value === 'clients') showCreateUserPoolClientModal.value = true
  else if (activeTab.value === 'resource-servers') showCreateResourceServerModal.value = true
}

// Lifecycle
onMounted(() => {
  loadUserPools()
})

watch(reloadTrigger, () => {
  loadUserPools()
  if (selectedUserPoolId.value) {
    loadUsers()
    loadGroups()
    loadUserPoolClients()
    loadResourceServers()
  }
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            Cognito Management
          </h1>
        </div>

        <Button
          variant="primary"
          @click="openCreateModal"
        >
          <template #icon-left>
            <PlusIcon class="h-4 w-4" />
          </template>
          Create {{ activeTab === 'pools' ? 'User Pool' : activeTab === 'users' ? 'User' : activeTab === 'groups' ? 'Group' : activeTab === 'clients' ? 'Client' : activeTab === 'resource-servers' ? 'Resource Server' : '' }}
        </Button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <Tabs
        v-model:active-tab="activeTab"
        :tabs="tabs"
        variant="underline"
        @update:active-tab="handleTabChange"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- User Pools Tab -->
      <template v-if="activeTab === 'pools'">
        <CognitoUserPoolList
          :user-pools="userPools"
          :loading="isLoading"
          :error="userPoolsError"
          @create="showCreateUserPoolModal = true"
          @edit="openEditUserPoolModal"
          @delete="(poolId) => { const pool = userPools.find(p => p.Id === poolId); if (pool) { poolToDelete = pool; showDeleteUserPoolModal = true } }"
        />
      </template>

      <!-- Users Tab -->
      <template v-else-if="activeTab === 'users'">
        <div
          v-if="userPools.length === 0"
          class="py-8"
        >
          <EmptyState
            icon="cloud"
            title="No user pools"
            description="Create a user pool first to manage users"
            action-label="Create User Pool"
            @action="showCreateUserPoolModal = true"
          />
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">User Pool:</label>
            <select
              v-model="selectedUserPoolId"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              @change="handleUserPoolSelect"
            >
              <option
                v-for="pool in userPools"
                :key="pool.Id"
                :value="pool.Id"
              >
                {{ pool.Name }}
              </option>
            </select>
          </div>
          <CognitoUserList
            :users="users"
            :loading="isLoading"
            :error="usersError"
            @create="showCreateUserModal = true"
            @edit="(user) => { userToEdit = user; showEditUserModal = true }"
            @delete="(username) => { userToDelete = username; showDeleteUserModal = true }"
            @reset-password="(user) => { userForPassword = user.Username; showResetPasswordModal = true }"
            @test-login="(user) => { userForLogin = user.Username; authResult = null; loadUserPoolClients(); showTestLoginModal = true }"
          />
        </template>
      </template>

      <!-- Groups Tab -->
      <template v-else-if="activeTab === 'groups'">
        <div
          v-if="userPools.length === 0"
          class="py-8"
        >
          <EmptyState
            icon="cloud"
            title="No user pools"
            description="Create a user pool first to manage groups"
            action-label="Create User Pool"
            @action="showCreateUserPoolModal = true"
          />
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">User Pool:</label>
            <select
              v-model="selectedUserPoolId"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              @change="handleUserPoolSelect"
            >
              <option
                v-for="pool in userPools"
                :key="pool.Id"
                :value="pool.Id"
              >
                {{ pool.Name }}
              </option>
            </select>
          </div>
          <CognitoGroupList
            :groups="groups"
            :loading="isLoading"
            :error="groupsError"
            @create="showCreateGroupModal = true"
            @edit="(group) => { groupToEdit = group; showEditGroupModal = true }"
            @delete="(groupName) => { groupToDelete = groupName; showDeleteGroupModal = true }"
            @members="handleOpenMembers"
          />
        </template>
      </template>

      <!-- Clients Tab -->
      <template v-else-if="activeTab === 'clients'">
        <div
          v-if="userPools.length === 0"
          class="py-8"
        >
          <EmptyState
            icon="cloud"
            title="No user pools"
            description="Create a user pool first to manage clients"
            action-label="Create User Pool"
            @action="showCreateUserPoolModal = true"
          />
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">User Pool:</label>
            <select
              v-model="selectedUserPoolId"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              @change="handleUserPoolSelect"
            >
              <option
                v-for="pool in userPools"
                :key="pool.Id"
                :value="pool.Id"
              >
                {{ pool.Name }}
              </option>
            </select>
          </div>
          <CognitoUserPoolClientList
            :clients="userPoolClients"
            :loading="isLoading"
            :error="userPoolClientsError"
            @create="showCreateUserPoolClientModal = true"
            @edit="(client) => { clientToEdit = client; showEditUserPoolClientModal = true }"
            @delete="(clientId) => { clientToDelete = clientId; showDeleteUserPoolClientModal = true }"
          />
        </template>
      </template>

      <!-- Resource Servers Tab -->
      <template v-else-if="activeTab === 'resource-servers'">
        <div
          v-if="userPools.length === 0"
          class="py-8"
        >
          <EmptyState
            icon="cloud"
            title="No user pools"
            description="Create a user pool first to manage resource servers"
            action-label="Create User Pool"
            @action="showCreateUserPoolModal = true"
          />
        </div>
        <template v-else>
          <div class="mb-4 flex items-center gap-3">
            <label class="text-sm font-medium text-light-text dark:text-dark-text">User Pool:</label>
            <select
              v-model="selectedUserPoolId"
              class="text-sm border rounded px-3 py-1.5"
              :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              @change="handleUserPoolSelect"
            >
              <option
                v-for="pool in userPools"
                :key="pool.Id"
                :value="pool.Id"
              >
                {{ pool.Name }}
              </option>
            </select>
          </div>
          <CognitoResourceServerList
            :resource-servers="resourceServers"
            :loading="isLoading"
            :error="resourceServersError"
            @create="showCreateResourceServerModal = true"
            @delete="(identifier) => { resourceServerToDelete = identifier; showDeleteResourceServerModal = true }"
          />
        </template>
      </template>
    </div>

    <!-- Create User Pool Modal -->
    <CognitoCreateUserPoolModal
      :open="showCreateUserPoolModal"
      @update:open="showCreateUserPoolModal = $event"
      @create="handleCreateUserPool"
    />

    <!-- Delete User Pool Modal -->
    <CognitoDeleteUserPoolModal
      :open="showDeleteUserPoolModal"
      :user-pool-id="poolToDelete?.Id || ''"
      :user-pool-name="poolToDelete?.Name || ''"
      @update:open="showDeleteUserPoolModal = $event"
      @confirm="handleDeleteUserPool"
    />

    <!-- Create User Modal -->
    <CognitoCreateUserModal
      :open="showCreateUserModal"
      @update:open="showCreateUserModal = $event"
      @create="handleCreateUser"
    />

    <!-- Delete User Modal -->
    <CognitoDeleteUserModal
      :open="showDeleteUserModal"
      :username="userToDelete || ''"
      @update:open="showDeleteUserModal = $event"
      @confirm="handleDeleteUser"
    />

    <!-- Create Group Modal -->
    <CognitoCreateGroupModal
      :open="showCreateGroupModal"
      @update:open="showCreateGroupModal = $event"
      @create="handleCreateGroup"
    />

    <!-- Delete Group Modal -->
    <CognitoDeleteGroupModal
      :open="showDeleteGroupModal"
      :group-name="groupToDelete || ''"
      @update:open="showDeleteGroupModal = $event"
      @confirm="handleDeleteGroup"
    />

    <!-- Edit User Pool Modal -->
    <CognitoEditUserPoolModal
      :open="showEditUserPoolModal"
      :user-pool-id="poolToEdit?.Id || ''"
      :pool-name="poolToEdit?.Name"
      :mfa-configuration="poolToEdit?.MfaConfiguration"
      :deletion-protection="poolToEdit?.DeletionProtection"
      :tags="poolTags"
      @update:open="showEditUserPoolModal = $event"
      @update="handleEditUserPool"
    />

    <!-- Edit User Modal -->
    <CognitoEditUserModal
      :open="showEditUserModal"
      :user-pool-id="selectedUserPoolId"
      :username="userToEdit?.Username || ''"
      :email="userToEdit?.UserAttributes?.find(a => a.Name === 'email')?.Value"
      :phone-number="userToEdit?.UserAttributes?.find(a => a.Name === 'phone_number')?.Value"
      @update:open="showEditUserModal = $event"
      @update="handleEditUser"
    />

    <!-- Edit Group Modal -->
    <CognitoEditGroupModal
      :open="showEditGroupModal"
      :user-pool-id="selectedUserPoolId"
      :group-name="groupToEdit?.GroupName || ''"
      :description="groupToEdit?.Description"
      :role-arn="groupToEdit?.RoleArn"
      :precedence="groupToEdit?.Precedence"
      @update:open="showEditGroupModal = $event"
      @update="handleEditGroup"
    />

    <!-- Create User Pool Client Modal -->
    <CognitoCreateUserPoolClientModal
      :open="showCreateUserPoolClientModal"
      @update:open="showCreateUserPoolClientModal = $event"
      @create="handleCreateUserPoolClient"
    />

    <!-- Edit User Pool Client Modal -->
    <CognitoEditUserPoolClientModal
      :open="showEditUserPoolClientModal"
      :user-pool-id="selectedUserPoolId"
      :client-id="clientToEdit?.ClientId || ''"
      :client-name="clientToEdit?.ClientName"
      :refresh-token-validity="clientToEdit?.RefreshTokenValidity"
      :access-token-validity="clientToEdit?.AccessTokenValidity"
      :id-token-validity="clientToEdit?.IdTokenValidity"
      @update:open="showEditUserPoolClientModal = $event"
      @update="handleEditUserPoolClient"
    />

    <!-- Delete User Pool Client Modal -->
    <CognitoDeleteUserPoolClientModal
      :open="showDeleteUserPoolClientModal"
      :client-id="clientToDelete || ''"
      :client-name="userPoolClients.find(c => c.ClientId === clientToDelete)?.ClientName"
      @update:open="showDeleteUserPoolClientModal = $event"
      @confirm="handleDeleteUserPoolClient"
    />

    <!-- Create Resource Server Modal -->
    <CognitoCreateResourceServerModal
      :open="showCreateResourceServerModal"
      @update:open="showCreateResourceServerModal = $event"
      @create="handleCreateResourceServer"
    />

    <!-- Delete Resource Server Modal -->
    <CognitoDeleteResourceServerModal
      :open="showDeleteResourceServerModal"
      :identifier="resourceServerToDelete || ''"
      :name="resourceServers.find(s => s.Identifier === resourceServerToDelete)?.Name"
      @update:open="showDeleteResourceServerModal = $event"
      @confirm="handleDeleteResourceServer"
    />

    <!-- Group Members Modal -->
    <CognitoGroupMembersModal
      :open="showGroupMembersModal"
      :user-pool-id="selectedUserPoolId"
      :group-name="groupForMembers?.GroupName || ''"
      :users="users"
      :members="groupMembers"
      :loading="groupMembersLoading"
      @update:open="showGroupMembersModal = $event"
      @add-user="handleAddUserToGroup"
      @remove-user="handleRemoveUserFromGroup"
    />

    <!-- Reset Password Modal -->
    <CognitoResetPasswordModal
      :open="showResetPasswordModal"
      :username="userForPassword || ''"
      @update:open="showResetPasswordModal = $event"
      @confirm="handleResetPassword"
    />

    <!-- Test Login Modal -->
    <CognitoTestLoginModal
      :open="showTestLoginModal"
      :username="userForLogin || ''"
      :user-pool-id="selectedUserPoolId"
      :clients="userPoolClients"
      :auth-result="authResult"
      @update:open="showTestLoginModal = $event"
      @test="handleTestLogin"
    />

    <!-- Usage Examples Section -->
    <div class="mt-8">
      <CodeSnippet
        title="Usage Examples"
        :snippets="codeExamples"
        default-tab="aws-cli"
        :disable-highlight="true"
      />
    </div>
  </div>
</template>