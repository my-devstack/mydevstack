<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Tabs from '@/components/common/Tabs.vue'
import {
  UserIcon,
  ShieldCheckIcon,
  KeyIcon,
  TrashIcon,
  PlusIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  EyeIcon,
  ExclamationCircleIcon,
  UserGroupIcon,
} from '@heroicons/vue/24/outline'
import {
  listUsers,
  createUser,
  deleteUser,
  getUser,
  listAccessKeys,
  createAccessKey,
  deleteAccessKey,
  listRoles,
  createRole,
  deleteRole,
  getRole,
  attachRolePolicy,
  detachRolePolicy,
  listAttachedRolePolicies,
  listPolicies,
  getPolicy,
  listGroups,
  createGroup,
  deleteGroup,
  getGroup,
  listUsersForGroup,
} from '@/api/services/iam'
import type { IAMUser, IAMRole, IAMPolicy, IAMGroup } from '@/api/types/aws'

// Components
const settingsStore = useSettingsStore()
const uiStore = useUIStore()
const { reloadTrigger } = useContentReload()

// Types
interface AccessKeyInfo {
  AccessKeyId: string
  Status: 'Active' | 'Inactive'
  CreateDate: string
}

interface AttachedPolicy {
  PolicyName: string
  PolicyArn: string
}

// State
const activeTab = ref('users')
const isLoading = ref(false)

// Users
const users = ref<IAMUser[]>([])
const selectedUser = ref<IAMUser | null>(null)
const userAccessKeys = ref<AccessKeyInfo[]>([])
const showCreateUserModal = ref(false)
const showDeleteUserModal = ref(false)
const showUserKeysModal = ref(false)
const showCreateKeyModal = ref(false)

// Roles
const roles = ref<IAMRole[]>([])
const selectedRole = ref<IAMRole | null>(null)
const rolePolicies = ref<AttachedPolicy[]>([])
const allPolicies = ref<IAMPolicy[]>([])
const showCreateRoleModal = ref(false)
const showDeleteRoleModal = ref(false)
const showRolePoliciesModal = ref(false)
const showAttachPolicyModal = ref(false)

// Policies
const policies = ref<IAMPolicy[]>([])
const selectedPolicy = ref<IAMPolicy | null>(null)
const showPolicyModal = ref(false)

// Groups
const groups = ref<IAMGroup[]>([])
const selectedGroup = ref<IAMGroup | null>(null)
const groupUsers = ref<Array<{ UserName: string; UserId: string; Arn: string }>>([])
const showCreateGroupModal = ref(false)
const showDeleteGroupModal = ref(false)
const showGroupUsersModal = ref(false)

// Forms
const newUser = ref({
  UserName: '',
  Path: '',
})

const newRole = ref({
  RoleName: '',
  Description: '',
  AssumeRolePolicyDocument: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { Service: 'ec2.amazonaws.com' },
        Action: 'sts:AssumeRole',
      },
    ],
  }, null, 2),
})

const newGroup = ref({
  GroupName: '',
  Path: '',
})

// Tabs
const tabs = [
  { id: 'users', label: 'Users', icon: UserIcon },
  { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
  { id: 'policies', label: 'Policies', icon: KeyIcon },
  { id: 'groups', label: 'Groups', icon: UserGroupIcon },
]

// Computed
const userCount = computed(() => users.value.length)
const roleCount = computed(() => roles.value.length)
const policyCount = computed(() => policies.value.length)
const groupCount = computed(() => groups.value.length)

// Helper functions
function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString()
}

// User functions
async function loadUsers() {
  isLoading.value = true
  try {
    const result = await listUsers()
    users.value = result.Users
  } catch (error) {
    uiStore.notifyError('Failed to load users', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

async function handleCreateUser() {
  if (!newUser.value.UserName.trim()) {
    uiStore.notifyError('Validation error', 'Username is required')
    return
  }

  try {
    await createUser({
      UserName: newUser.value.UserName,
      Path: newUser.value.Path || undefined,
    })
    uiStore.notifySuccess('User created', `User "${newUser.value.UserName}" created successfully`)
    showCreateUserModal.value = false
    newUser.value = { UserName: '', Path: '' }
    await loadUsers()
  } catch (error) {
    uiStore.notifyError('Failed to create user', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDeleteUser() {
  if (!selectedUser.value) return

  try {
    await deleteUser(selectedUser.value.UserName)
    uiStore.notifySuccess('User deleted', `User "${selectedUser.value.UserName}" deleted successfully`)
    showDeleteUserModal.value = false
    selectedUser.value = null
    await loadUsers()
  } catch (error) {
    uiStore.notifyError('Failed to delete user', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function loadUserAccessKeys() {
  if (!selectedUser.value) return

  try {
    const result = await listAccessKeys(selectedUser.value.UserName)
    userAccessKeys.value = result.AccessKeyMetadata || []
  } catch (error) {
    uiStore.notifyError('Failed to load access keys', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleCreateAccessKey() {
  if (!selectedUser.value) return

  try {
    const result = await createAccessKey(selectedUser.value.UserName)
    const { AccessKeyId, SecretAccessKey } = result.Access
    uiStore.notifySuccess('Access key created', `Access Key: ${AccessKeyId}. Save the Secret Access Key - it cannot be retrieved again!`)
    showCreateKeyModal.value = false
    await loadUserAccessKeys()
  } catch (error) {
    uiStore.notifyError('Failed to create access key', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDeleteAccessKey(keyId: string) {
  if (!selectedUser.value) return

  try {
    await deleteAccessKey(keyId, selectedUser.value.UserName)
    uiStore.notifySuccess('Access key deleted', 'Access key deleted successfully')
    await loadUserAccessKeys()
  } catch (error) {
    uiStore.notifyError('Failed to delete access key', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function viewUserDetails(user: IAMUser) {
  selectedUser.value = user
  await loadUserAccessKeys()
  showUserKeysModal.value = true
}

function selectUserForAction(user: IAMUser, action: 'delete' | 'keys') {
  selectedUser.value = user
  if (action === 'delete') {
    showDeleteUserModal.value = true
  } else if (action === 'keys') {
    viewUserDetails(user)
  }
}

// Role functions
async function loadRoles() {
  isLoading.value = true
  try {
    const result = await listRoles()
    roles.value = result.Roles
  } catch (error) {
    uiStore.notifyError('Failed to load roles', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

async function handleCreateRole() {
  if (!newRole.value.RoleName.trim()) {
    uiStore.notifyError('Validation error', 'Role name is required')
    return
  }

  try {
    await createRole({
      RoleName: newRole.value.RoleName,
      Description: newRole.value.Description || undefined,
      AssumeRolePolicyDocument: newRole.value.AssumeRolePolicyDocument,
    })
    uiStore.notifySuccess('Role created', `Role "${newRole.value.RoleName}" created successfully`)
    showCreateRoleModal.value = false
    newRole.value = {
      RoleName: '',
      Description: '',
      AssumeRolePolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }, null, 2),
    }
    await loadRoles()
  } catch (error) {
    uiStore.notifyError('Failed to create role', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDeleteRole() {
  if (!selectedRole.value) return

  try {
    await deleteRole(selectedRole.value.RoleName)
    uiStore.notifySuccess('Role deleted', `Role "${selectedRole.value.RoleName}" deleted successfully`)
    showDeleteRoleModal.value = false
    selectedRole.value = null
    await loadRoles()
  } catch (error) {
    uiStore.notifyError('Failed to delete role', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function loadRolePolicies() {
  if (!selectedRole.value) return

  try {
    const result = await listAttachedRolePolicies(selectedRole.value.RoleName)
    rolePolicies.value = result.AttachedPolicies || []
  } catch (error) {
    console.error('Failed to load role policies:', error)
  }
}

async function loadAllPolicies() {
  try {
    const result = await listPolicies({ Scope: 'All' })
    allPolicies.value = result.Policies
  } catch (error) {
    console.error('Failed to load policies:', error)
  }
}

async function handleAttachPolicy(policyArn: string) {
  if (!selectedRole.value) return

  try {
    await attachRolePolicy(selectedRole.value.RoleName, policyArn)
    uiStore.notifySuccess('Policy attached', 'Policy attached successfully')
    await loadRolePolicies()
    showAttachPolicyModal.value = false
  } catch (error) {
    uiStore.notifyError('Failed to attach policy', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDetachPolicy(policyArn: string) {
  if (!selectedRole.value) return

  try {
    await detachRolePolicy(selectedRole.value.RoleName, policyArn)
    uiStore.notifySuccess('Policy detached', 'Policy detached successfully')
    await loadRolePolicies()
  } catch (error) {
    uiStore.notifyError('Failed to detach policy', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function viewRolePolicies(role: IAMRole) {
  selectedRole.value = role
  await loadRolePolicies()
  showRolePoliciesModal.value = true
}

async function openAttachPolicy() {
  await loadAllPolicies()
  showAttachPolicyModal.value = true
}

function selectRoleForAction(role: IAMRole, action: 'delete' | 'policies') {
  selectedRole.value = role
  if (action === 'delete') {
    showDeleteRoleModal.value = true
  } else if (action === 'policies') {
    viewRolePolicies(role)
  }
}

// Policy functions
async function loadPolicies() {
  isLoading.value = true
  try {
    const result = await listPolicies({ Scope: 'All' })
    policies.value = result.Policies
  } catch (error) {
    uiStore.notifyError('Failed to load policies', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

async function viewPolicy(policy: IAMPolicy) {
  selectedPolicy.value = policy
  showPolicyModal.value = true
}

// Group functions
async function loadGroups() {
  isLoading.value = true
  try {
    const result = await listGroups()
    groups.value = result.Groups
  } catch (error) {
    uiStore.notifyError('Failed to load groups', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    isLoading.value = false
  }
}

async function handleCreateGroup() {
  if (!newGroup.value.GroupName.trim()) {
    uiStore.notifyError('Validation error', 'Group name is required')
    return
  }

  try {
    await createGroup({
      GroupName: newGroup.value.GroupName,
      Path: newGroup.value.Path || undefined,
    })
    uiStore.notifySuccess('Group created', `Group "${newGroup.value.GroupName}" created successfully`)
    showCreateGroupModal.value = false
    newGroup.value = { GroupName: '', Path: '' }
    await loadGroups()
  } catch (error) {
    uiStore.notifyError('Failed to create group', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDeleteGroup() {
  if (!selectedGroup.value) return

  try {
    await deleteGroup(selectedGroup.value.GroupName)
    uiStore.notifySuccess('Group deleted', `Group "${selectedGroup.value.GroupName}" deleted successfully`)
    showDeleteGroupModal.value = false
    selectedGroup.value = null
    await loadGroups()
  } catch (error) {
    uiStore.notifyError('Failed to delete group', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function loadGroupUsers() {
  if (!selectedGroup.value) return

  try {
    groupUsers.value = await listUsersForGroup(selectedGroup.value.GroupName)
  } catch (error) {
    console.error('Failed to load group users:', error)
  }
}

async function viewGroupUsers(group: IAMGroup) {
  selectedGroup.value = group
  await loadGroupUsers()
  showGroupUsersModal.value = true
}

function selectGroupForAction(group: IAMGroup, action: 'delete' | 'users') {
  selectedGroup.value = group
  if (action === 'delete') {
    showDeleteGroupModal.value = true
  } else if (action === 'users') {
    viewGroupUsers(group)
  }
}

// Lifecycle
onMounted(() => {
  loadUsers()
  loadRoles()
  loadPolicies()
  loadGroups()
})

watch(reloadTrigger, () => {
  loadUsers()
  loadRoles()
  loadPolicies()
  loadGroups()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            IAM Management
          </h1>
        </div>

        <Button
          variant="primary"
          @click="() => {
            if (activeTab === 'users') showCreateUserModal = true
            else if (activeTab === 'roles') showCreateRoleModal = true
            else if (activeTab === 'policies') showPolicyModal = false
            else if (activeTab === 'groups') showCreateGroupModal = true
          }"
        >
          <template #icon-left>
            <PlusIcon class="h-4 w-4" />
          </template>
          Create {{ activeTab === 'users' ? 'User' : activeTab === 'roles' ? 'Role' : activeTab === 'policies' ? '' : 'Group' }}
        </Button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6">
      <Tabs
        v-model:active-tab="activeTab"
        :tabs="tabs"
        variant="underline"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <!-- Loading -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12"
      >
        <LoadingSpinner size="lg" />
      </div>

      <!-- Users Tab -->
      <template v-else-if="activeTab === 'users'">
        <EmptyState
          v-if="users.length === 0"
          icon="user"
          title="No IAM users"
          description="Create your first IAM user to get started"
          action-label="Create User"
          @action="showCreateUserModal = true"
        />

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="user in users"
            :key="user.UserName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 hover:border-primary-500 transition-all"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <UserIcon class="h-6 w-6" />
              </div>
              <div>
                <h3 class="font-medium text-light-text dark:text-dark-text">
                  {{ user.UserName }}
                </h3>
                <p class="text-xs text-light-muted dark:text-dark-muted">
                  {{ user.UserId }}
                </p>
              </div>
            </div>
            <div class="text-xs text-light-muted dark:text-dark-muted mb-3">
              <p>ARN: {{ user.Arn }}</p>
              <p>Created: {{ formatDate(user.CreateDate) }}</p>
            </div>
            <div class="flex items-center gap-2 pt-3 border-t border-light-border dark:border-dark-border">
              <Button
                variant="ghost"
                size="sm"
                @click="selectUserForAction(user, 'keys')"
              >
                <template #icon-left>
                  <KeyIcon class="h-4 w-4" />
                </template>
                Keys
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="selectUserForAction(user, 'delete')"
              >
                <template #icon-left>
                  <TrashIcon class="h-4 w-4" />
                </template>
              </Button>
            </div>
          </div>
        </div>
      </template>

      <!-- Roles Tab -->
      <template v-else-if="activeTab === 'roles'">
        <EmptyState
          v-if="roles.length === 0"
          icon="shield-check"
          title="No IAM roles"
          description="Create your first IAM role to get started"
          action-label="Create Role"
          @action="showCreateRoleModal = true"
        />

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="role in roles"
            :key="role.RoleName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 hover:border-primary-500 transition-all"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <ShieldCheckIcon class="h-6 w-6" />
              </div>
              <div>
                <h3 class="font-medium text-light-text dark:text-dark-text">
                  {{ role.RoleName }}
                </h3>
                <p class="text-xs text-light-muted dark:text-dark-muted">
                  {{ role.RoleId }}
                </p>
              </div>
            </div>
            <div class="text-xs text-light-muted dark:text-dark-muted mb-3">
              <p>ARN: {{ role.Arn }}</p>
              <p>Created: {{ formatDate(role.CreateDate) }}</p>
            </div>
            <div class="flex items-center gap-2 pt-3 border-t border-light-border dark:border-dark-border">
              <Button
                variant="ghost"
                size="sm"
                @click="selectRoleForAction(role, 'policies')"
              >
                <template #icon-left>
                  <KeyIcon class="h-4 w-4" />
                </template>
                Policies
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="selectRoleForAction(role, 'delete')"
              >
                <template #icon-left>
                  <TrashIcon class="h-4 w-4" />
                </template>
              </Button>
            </div>
          </div>
        </div>
      </template>

      <!-- Policies Tab -->
      <template v-else-if="activeTab === 'policies'">
        <EmptyState
          v-if="policies.length === 0"
          icon="key"
          title="No IAM policies"
          description="No customer managed policies found"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="policy in policies"
            :key="policy.Arn"
            class="flex items-center justify-between p-4 rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface hover:border-primary-500 transition-all"
          >
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <KeyIcon class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-medium text-light-text dark:text-dark-text">
                  {{ policy.PolicyName }}
                </h3>
                <p class="text-xs text-light-muted dark:text-dark-muted">
                  {{ policy.Arn }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge
                :status="policy.IsAttachable ? 'active' : 'inactive'"
                :label="policy.IsAttachable ? 'Attachable' : 'Not Attachable'"
              />
              <Button
                variant="ghost"
                size="sm"
                @click="viewPolicy(policy)"
              >
                <template #icon-left>
                  <EyeIcon class="h-4 w-4" />
                </template>
                View
              </Button>
            </div>
          </div>
        </div>
      </template>

      <!-- Groups Tab -->
      <template v-else-if="activeTab === 'groups'">
        <EmptyState
          v-if="groups.length === 0"
          icon="users"
          title="No IAM groups"
          description="Create your first IAM group to get started"
          action-label="Create Group"
          @action="showCreateGroupModal = true"
        />

        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <div
            v-for="group in groups"
            :key="group.GroupName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface p-4 hover:border-primary-500 transition-all"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                <UserGroupIcon class="h-6 w-6" />
              </div>
              <div>
                <h3 class="font-medium text-light-text dark:text-dark-text">
                  {{ group.GroupName }}
                </h3>
                <p class="text-xs text-light-muted dark:text-dark-muted">
                  {{ group.GroupId }}
                </p>
              </div>
            </div>
            <div class="text-xs text-light-muted dark:text-dark-muted mb-3">
              <p>ARN: {{ group.Arn }}</p>
              <p>Created: {{ formatDate(group.CreateDate) }}</p>
            </div>
            <div class="flex items-center gap-2 pt-3 border-t border-light-border dark:border-dark-border">
              <Button
                variant="ghost"
                size="sm"
                @click="selectGroupForAction(group, 'users')"
              >
                <template #icon-left>
                  <UserIcon class="h-4 w-4" />
                </template>
                Users
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="selectGroupForAction(group, 'delete')"
              >
                <template #icon-left>
                  <TrashIcon class="h-4 w-4" />
                </template>
              </Button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Create User Modal -->
    <Modal
      :open="showCreateUserModal"
      title="Create User"
      size="md"
      @update:open="showCreateUserModal = $event"
    >
      <form
        class="space-y-4"
        @submit.prevent="handleCreateUser"
      >
        <FormInput
          v-model="newUser.UserName"
          label="User Name"
          placeholder="username"
          required
        />
        <FormInput
          v-model="newUser.Path"
          label="Path"
          placeholder="/"
          help-text="Optional path for the user"
        />
      </form>
      <template #footer>
        <Button
          variant="secondary"
          @click="showCreateUserModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="handleCreateUser"
        >
          Create
        </Button>
      </template>
    </Modal>

    <!-- Delete User Modal -->
    <Modal
      :open="showDeleteUserModal"
      title="Delete User"
      size="md"
      @update:open="showDeleteUserModal = $event"
    >
      <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <ExclamationCircleIcon class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-red-700 dark:text-red-400">
            Are you sure you want to delete <strong>{{ selectedUser?.UserName }}</strong>?
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showDeleteUserModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          @click="handleDeleteUser"
        >
          Delete
        </Button>
      </template>
    </Modal>

    <!-- User Access Keys Modal -->
    <Modal
      :open="showUserKeysModal"
      title="Access Keys"
      size="lg"
      @update:open="showUserKeysModal = $event"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
            Access Keys for {{ selectedUser?.UserName }}
          </h3>
          <Button
            variant="primary"
            size="sm"
            @click="showCreateKeyModal = true"
          >
            <template #icon-left>
              <PlusIcon class="h-4 w-4" />
            </template>
            Create Key
          </Button>
        </div>

        <EmptyState
          v-if="userAccessKeys.length === 0"
          icon="key"
          title="No access keys"
          description="Create an access key to enable programmatic access"
          compact
        />

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="key in userAccessKeys"
            :key="key.AccessKeyId"
            class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
          >
            <div>
              <p class="text-sm font-mono text-light-text dark:text-dark-text">
                {{ key.AccessKeyId }}
              </p>
              <p class="text-xs text-light-muted dark:text-dark-muted">
                Created: {{ formatDate(key.CreateDate) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <StatusBadge
                :status="key.Status === 'Active' ? 'active' : 'inactive'"
                :label="key.Status"
              />
              <Button
                variant="ghost"
                size="sm"
                @click="handleDeleteAccessKey(key.AccessKeyId)"
              >
                <template #icon-left>
                  <TrashIcon class="h-4 w-4" />
                </template>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showUserKeysModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Create Access Key Modal -->
    <Modal
      :open="showCreateKeyModal"
      title="Create Access Key"
      size="md"
      @update:open="showCreateKeyModal = $event"
    >
      <div class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          Make sure to save the Secret Access Key. It cannot be retrieved after closing this modal.
        </p>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showCreateKeyModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="handleCreateAccessKey"
        >
          Create Key
        </Button>
      </template>
    </Modal>

    <!-- Create Role Modal -->
    <Modal
      :open="showCreateRoleModal"
      title="Create Role"
      size="lg"
      @update:open="showCreateRoleModal = $event"
    >
      <form
        class="space-y-4"
        @submit.prevent="handleCreateRole"
      >
        <FormInput
          v-model="newRole.RoleName"
          label="Role Name"
          placeholder="my-role"
          required
        />
        <FormInput
          v-model="newRole.Description"
          label="Description"
          placeholder="Role description"
        />
        <div>
          <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">Assume Role Policy</label>
          <textarea
            v-model="newRole.AssumeRolePolicyDocument"
            rows="10"
            class="block w-full rounded-md shadow-sm border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface text-light-text dark:text-dark-text px-3 py-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </form>
      <template #footer>
        <Button
          variant="secondary"
          @click="showCreateRoleModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="handleCreateRole"
        >
          Create
        </Button>
      </template>
    </Modal>

    <!-- Delete Role Modal -->
    <Modal
      :open="showDeleteRoleModal"
      title="Delete Role"
      size="md"
      @update:open="showDeleteRoleModal = $event"
    >
      <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <ExclamationCircleIcon class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-red-700 dark:text-red-400">
            Are you sure you want to delete <strong>{{ selectedRole?.RoleName }}</strong>?
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showDeleteRoleModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          @click="handleDeleteRole"
        >
          Delete
        </Button>
      </template>
    </Modal>

    <!-- Role Policies Modal -->
    <Modal
      :open="showRolePoliciesModal"
      title="Attached Policies"
      size="lg"
      @update:open="showRolePoliciesModal = $event"
    >
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
            Policies for {{ selectedRole?.RoleName }}
          </h3>
          <Button
            variant="primary"
            size="sm"
            @click="openAttachPolicy"
          >
            <template #icon-left>
              <PlusCircleIcon class="h-4 w-4" />
            </template>
            Attach Policy
          </Button>
        </div>

        <EmptyState
          v-if="rolePolicies.length === 0"
          icon="key"
          title="No attached policies"
          description="Attach a policy to this role"
          compact
        />

        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="policy in rolePolicies"
            :key="policy.PolicyArn"
            class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
          >
            <div>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ policy.PolicyName }}
              </p>
              <p class="text-xs text-light-muted dark:text-dark-muted font-mono truncate">
                {{ policy.PolicyArn }}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              @click="handleDetachPolicy(policy.PolicyArn)"
            >
              <template #icon-left>
                <MinusCircleIcon class="h-4 w-4" />
              </template>
            </Button>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showRolePoliciesModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Attach Policy Modal -->
    <Modal
      :open="showAttachPolicyModal"
      title="Attach Policy"
      size="lg"
      @update:open="showAttachPolicyModal = $event"
    >
      <div class="space-y-3">
        <EmptyState
          v-if="allPolicies.length === 0"
          icon="key"
          title="No policies available"
          description="No policies found"
          compact
        />
        <div
          v-else
          class="max-h-96 overflow-auto"
        >
          <div
            v-for="policy in allPolicies"
            :key="policy.Arn"
            class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg mb-2"
          >
            <div>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ policy.PolicyName }}
              </p>
              <p class="text-xs text-light-muted dark:text-dark-muted">
                {{ policy.Arn }}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              @click="handleAttachPolicy(policy.Arn)"
            >
              Attach
            </Button>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showAttachPolicyModal = false"
        >
          Cancel
        </Button>
      </template>
    </Modal>

    <!-- Policy Details Modal -->
    <Modal
      :open="showPolicyModal"
      title="Policy Details"
      size="xl"
      @update:open="showPolicyModal = $event"
    >
      <div
        v-if="selectedPolicy"
        class="space-y-4"
      >
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Name</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedPolicy.PolicyName }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ selectedPolicy.Arn }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ID</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedPolicy.PolicyId }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Attachments</label>
            <p class="text-sm text-light-text dark:text-dark-text">
              {{ selectedPolicy.AttachmentCount }}
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showPolicyModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>

    <!-- Create Group Modal -->
    <Modal
      :open="showCreateGroupModal"
      title="Create Group"
      size="md"
      @update:open="showCreateGroupModal = $event"
    >
      <form
        class="space-y-4"
        @submit.prevent="handleCreateGroup"
      >
        <FormInput
          v-model="newGroup.GroupName"
          label="Group Name"
          placeholder="my-group"
          required
        />
        <FormInput
          v-model="newGroup.Path"
          label="Path"
          placeholder="/"
          help-text="Optional path for the group"
        />
      </form>
      <template #footer>
        <Button
          variant="secondary"
          @click="showCreateGroupModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          @click="handleCreateGroup"
        >
          Create
        </Button>
      </template>
    </Modal>

    <!-- Delete Group Modal -->
    <Modal
      :open="showDeleteGroupModal"
      title="Delete Group"
      size="md"
      @update:open="showDeleteGroupModal = $event"
    >
      <div class="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
        <ExclamationCircleIcon class="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-sm text-red-700 dark:text-red-400">
            Are you sure you want to delete <strong>{{ selectedGroup?.GroupName }}</strong>?
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showDeleteGroupModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          @click="handleDeleteGroup"
        >
          Delete
        </Button>
      </template>
    </Modal>

    <!-- Group Users Modal -->
    <Modal
      :open="showGroupUsersModal"
      title="Group Users"
      size="lg"
      @update:open="showGroupUsersModal = $event"
    >
      <div class="space-y-4">
        <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
          Users in {{ selectedGroup?.GroupName }}
        </h3>
        <EmptyState
          v-if="groupUsers.length === 0"
          icon="user"
          title="No users"
          description="This group has no users"
          compact
        />
        <div
          v-else
          class="space-y-2"
        >
          <div
            v-for="user in groupUsers"
            :key="user.UserName"
            class="flex items-center justify-between p-3 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
          >
            <div>
              <p class="text-sm text-light-text dark:text-dark-text">
                {{ user.UserName }}
              </p>
              <p class="text-xs text-light-muted dark:text-dark-muted">
                {{ user.Arn }}
              </p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showGroupUsersModal = false"
        >
          Close
        </Button>
      </template>
    </Modal>
  </div>
</template>
