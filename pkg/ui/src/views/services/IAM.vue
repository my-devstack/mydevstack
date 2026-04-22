<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useUIStore } from '@/stores/ui'
import { useContentReload } from '@/composables/useContentReload'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
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
  ClipboardIcon,
  ChevronRightIcon,
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
  addUserToGroup,
  removeUserFromGroup,
  deletePolicy,
  createPolicy,
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
const newAccessKey = ref<{ AccessKeyId: string; SecretAccessKey: string } | null>(null)

// Roles
const roles = ref<IAMRole[]>([])
const selectedRole = ref<IAMRole | null>(null)
const rolePolicies = ref<AttachedPolicy[]>([])
const allPolicies = ref<IAMPolicy[]>([])
const showCreateRoleModal = ref(false)
const showDeleteRoleModal = ref(false)
const showRolePoliciesModal = ref(false)
const showAttachPolicyModal = ref(false)
const showDetachPolicyModal = ref(false)
const policyToDetach = ref<{ roleName: string; policyArn: string; policyName: string } | null>(null)
const showDeleteKeyModal = ref(false)
const keyToDelete = ref<{ accessKeyId: string; userName: string } | null>(null)

// Policies
const policies = ref<IAMPolicy[]>([])
const selectedPolicy = ref<IAMPolicy | null>(null)
const showPolicyModal = ref(false)
const showDeletePolicyModal = ref(false)
const showCreatePolicyModal = ref(false)
const expandedPolicies = ref<Set<string>>(new Set())
const policyDocuments = ref<Record<string, any>>({})
const loadingPolicyDocument = ref<string | null>(null)
const newPolicy = ref({
  PolicyName: '',
  PolicyDocument: '',
  Description: '',
})

// Groups
const groups = ref<IAMGroup[]>([])
const selectedGroup = ref<IAMGroup | null>(null)
const groupUsers = ref<Array<{ UserName: string; UserId: string; Arn: string }>>([])
const showCreateGroupModal = ref(false)
const showDeleteGroupModal = ref(false)
const groupToDelete = ref<IAMGroup | null>(null)
const showGroupUsersModal = ref(false)
const showAddUserToGroupModal = ref(false)
const showRemoveUserModal = ref(false)
const selectedUserToAdd = ref('')
const addingUserToGroup = ref(false)
const removingUserFromGroup = ref(false)
const expandedGroups = ref<Set<string>>(new Set())
const expandedUsers = ref<Set<string>>(new Set())
const expandedRoles = ref<Set<string>>(new Set())
const userAccessKeysMap = ref<Record<string, any[]>>({})
const rolePoliciesMap = ref<Record<string, any[]>>({})
const userToRemove = ref<{ userName: string; groupName: string } | null>(null)

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
    const accessKey = result.AccessKey || result
    newAccessKey.value = {
      AccessKeyId: accessKey.AccessKeyId,
      SecretAccessKey: accessKey.SecretAccessKey,
    }
    await loadUserAccessKeys()
    const keysResult = await listAccessKeys(selectedUser.value.UserName)
    userAccessKeysMap.value[selectedUser.value.UserName] = keysResult.AccessKeyMetadata || []
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

function openDeleteKeyModal(accessKeyId: string, userName: string) {
  keyToDelete.value = { accessKeyId, userName }
  showDeleteKeyModal.value = true
}

async function handleDeleteAccessKeyConfirm() {
  if (!keyToDelete.value) return

  try {
    await deleteAccessKey(keyToDelete.value.accessKeyId, keyToDelete.value.userName)
    uiStore.notifySuccess('Access key deleted', `Access key "${keyToDelete.value.accessKeyId}" deleted`)
    showDeleteKeyModal.value = false
    const result = await listAccessKeys(keyToDelete.value.userName)
    userAccessKeysMap.value[keyToDelete.value.userName] = result.AccessKeyMetadata || []
    keyToDelete.value = null
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
    const result = await listAttachedRolePolicies(selectedRole.value.RoleName)
    rolePoliciesMap.value[selectedRole.value.RoleName] = result.AttachedPolicies || []
    showAttachPolicyModal.value = false
  } catch (error) {
    uiStore.notifyError('Failed to attach policy', error instanceof Error ? error.message : 'Unknown error')
  }
}

function openDetachPolicyModal(roleName: string, policyArn: string, policyName: string) {
  policyToDetach.value = { roleName, policyArn, policyName }
  showDetachPolicyModal.value = true
}

async function handleDetachPolicy() {
  if (!policyToDetach.value) return

  const { roleName, policyArn } = policyToDetach.value
  try {
    await detachRolePolicy(roleName, policyArn)
    uiStore.notifySuccess('Policy detached', 'Policy detached successfully')
    showDetachPolicyModal.value = false
    const result = await listAttachedRolePolicies(roleName)
    rolePoliciesMap.value[roleName] = result.AttachedPolicies || []
    policyToDetach.value = null
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

async function handleDeletePolicy() {
  if (!selectedPolicy.value) return
  try {
    await deletePolicy(selectedPolicy.value.Arn)
    uiStore.notifySuccess('Policy deleted', `Policy "${selectedPolicy.value.PolicyName}" deleted`)
    showDeletePolicyModal.value = false
    expandedPolicies.value.delete(selectedPolicy.value.Arn)
    await loadPolicies()
  } catch (error) {
    let message = 'Unknown error'
    if (error instanceof Error) {
      message = error.message
      if (message.includes('Cannot modify or delete AWS managed policy')) {
        message = `Cannot delete AWS managed policy "${selectedPolicy.value.PolicyName}". Only customer managed policies can be deleted.`
      }
    }
    uiStore.notifyError('Failed to delete policy', message)
  }
}

async function togglePolicy(policyArn: string) {
  if (expandedPolicies.value.has(policyArn)) {
    expandedPolicies.value.delete(policyArn)
  } else {
    expandedPolicies.value.add(policyArn)
    if (!policyDocuments.value[policyArn]) {
      loadingPolicyDocument.value = policyArn
      try {
        const result = await getPolicy(policyArn)
        policyDocuments.value[policyArn] = result.Policy
      } catch (error) {
        console.error('Failed to load policy document:', error)
      } finally {
        loadingPolicyDocument.value = null
      }
    }
  }
}

const creatingPolicy = ref(false)

async function handleCreatePolicy() {
  if (!newPolicy.value.PolicyName.trim() || !newPolicy.value.PolicyDocument.trim()) {
    uiStore.notifyError('Validation error', 'Policy name and policy document are required')
    return
  }
  creatingPolicy.value = true
  try {
    await createPolicy({
      PolicyName: newPolicy.value.PolicyName,
      PolicyDocument: newPolicy.value.PolicyDocument,
      Description: newPolicy.value.Description || undefined,
    })
    uiStore.notifySuccess('Policy created', `Policy "${newPolicy.value.PolicyName}" created successfully`)
    showCreatePolicyModal.value = false
    newPolicy.value = { PolicyName: '', PolicyDocument: '', Description: '' }
    await loadPolicies()
  } catch (error) {
    uiStore.notifyError('Failed to create policy', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    creatingPolicy.value = false
  }
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
    await createGroup(newGroup.value.GroupName, newGroup.value.Path || undefined)
    uiStore.notifySuccess('Group created', `Group "${newGroup.value.GroupName}" created successfully`)
    showCreateGroupModal.value = false
    newGroup.value = { GroupName: '', Path: '' }
    await loadGroups()
  } catch (error) {
    uiStore.notifyError('Failed to create group', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function handleDeleteGroup() {
  if (!groupToDelete.value) return

  const groupName = groupToDelete.value.GroupName
  try {
    await deleteGroup(groupToDelete.value.GroupName)
    uiStore.notifySuccess('Group deleted', `Group "${groupName}" deleted successfully`)
    showDeleteGroupModal.value = false
    expandedGroups.value.delete(groupName)
    groupToDelete.value = null
    await loadGroups()
  } catch (error) {
    uiStore.notifyError('Failed to delete group', error instanceof Error ? error.message : 'Unknown error')
  }
}

async function loadGroupUsers() {
  if (!selectedGroup.value) return

  try {
    const result = await listUsersForGroup(selectedGroup.value.GroupName)
    groupUsers.value = result.Users || []
  } catch (error) {
    console.error('Failed to load group users:', error)
    groupUsers.value = []
  }
}

async function viewGroupUsers(group: IAMGroup) {
  selectedGroup.value = group
  await loadGroupUsers()
  showGroupUsersModal.value = true
}

const groupUsersMap = ref<Record<string, any[]>>({})

async function toggleGroup(groupName: string) {
  if (expandedGroups.value.has(groupName)) {
    expandedGroups.value.delete(groupName)
  } else {
    expandedGroups.value.add(groupName)
    if (!groupUsersMap.value[groupName]) {
      try {
        const result = await listUsersForGroup(groupName)
        groupUsersMap.value[groupName] = result.Users || []
      } catch (error) {
        console.error('Failed to load group users:', error)
        groupUsersMap.value[groupName] = []
      }
    }
  }
}

async function toggleUser(userName: string) {
  if (expandedUsers.value.has(userName)) {
    expandedUsers.value.delete(userName)
  } else {
    expandedUsers.value.add(userName)
    if (!userAccessKeysMap.value[userName]) {
      try {
        const result = await listAccessKeys(userName)
        userAccessKeysMap.value[userName] = result.AccessKeyMetadata || []
      } catch (error) {
        console.error('Failed to load access keys:', error)
        userAccessKeysMap.value[userName] = []
      }
    }
  }
}

async function toggleRole(roleName: string) {
  if (expandedRoles.value.has(roleName)) {
    expandedRoles.value.delete(roleName)
  } else {
    expandedRoles.value.add(roleName)
    if (!rolePoliciesMap.value[roleName]) {
      try {
        const result = await listAttachedRolePolicies(roleName)
        rolePoliciesMap.value[roleName] = result.AttachedPolicies || []
      } catch (error) {
        console.error('Failed to load role policies:', error)
        rolePoliciesMap.value[roleName] = []
      }
    }
  }
}

async function handleAddUserToGroup() {
  if (!selectedGroup.value || !selectedUserToAdd.value) return
  addingUserToGroup.value = true
  try {
    await addUserToGroup(selectedGroup.value.GroupName, selectedUserToAdd.value)
    uiStore.notifySuccess('User added', `User "${selectedUserToAdd.value}" added to group`)
    selectedUserToAdd.value = ''
    showAddUserToGroupModal.value = false
    await loadGroupUsers()
  } catch (error) {
    uiStore.notifyError('Failed to add user', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    addingUserToGroup.value = false
  }
}

function openRemoveUserModal(groupName: string, userName: string) {
  userToRemove.value = { userName, groupName }
  showRemoveUserModal.value = true
}

async function handleRemoveUserFromGroup() {
  if (!userToRemove.value) return
  const { groupName, userName } = userToRemove.value
  removingUserFromGroup.value = true
  try {
    await removeUserFromGroup(groupName, userName)
    uiStore.notifySuccess('User removed', `User "${userName}" removed from group`)
    showRemoveUserModal.value = false
    const result = await listUsersForGroup(groupName)
    groupUsersMap.value[groupName] = result.Users || []
    userToRemove.value = null
  } catch (error) {
    uiStore.notifyError('Failed to remove user', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    removingUserFromGroup.value = false
  }
}

async function handleAddUserToGroupFromList(groupName: string) {
  if (!selectedUserToAdd.value) return
  addingUserToGroup.value = true
  try {
    await addUserToGroup(groupName, selectedUserToAdd.value)
    uiStore.notifySuccess('User added', `User "${selectedUserToAdd.value}" added to group`)
    selectedUserToAdd.value = ''
    showAddUserToGroupModal.value = false
    const result = await listUsersForGroup(groupName)
    groupUsersMap.value[groupName] = result.Users || []
  } catch (error) {
    uiStore.notifyError('Failed to add user', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    addingUserToGroup.value = false
  }
}

const availableUsersForGroup = computed(() => {
  const groupUserNames = new Set(
    (selectedGroup.value ? (groupUsersMap.value[selectedGroup.value.GroupName] || []) : groupUsers.value)
      .map(u => u.UserName)
  )
  return users.value.filter(u => !groupUserNames.has(u.UserName))
})

function selectGroupForAction(group: IAMGroup, action: 'delete' | 'users') {
  selectedGroup.value = group
  if (action === 'delete') {
    groupToDelete.value = group
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
            else if (activeTab === 'policies') showCreatePolicyModal = true
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
          class="space-y-3"
        >
          <div
            v-for="user in users"
            :key="user.UserName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleUser(user.UserName)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <UserIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ user.UserName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ user.Arn }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="selectUserForAction(user, 'delete')"
                >
                  <template #icon-left>
                    <TrashIcon class="h-4 w-4" />
                  </template>
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedUsers.has(user.UserName) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedUsers.has(user.UserName)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">User ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ user.UserId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ formatDate(user.CreateDate) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-between mb-3">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Access Keys</label>
                <Button
                  variant="primary"
                  size="sm"
                  @click.stop="selectedUser = user; showCreateKeyModal = true"
                >
                  <template #icon-left>
                    <PlusIcon class="h-4 w-4" />
                  </template>
                  Create Key
                </Button>
              </div>
              <EmptyState
                v-if="!userAccessKeysMap[user.UserName] || userAccessKeysMap[user.UserName].length === 0"
                icon="key"
                title="No access keys"
                description="This user has no access keys"
                compact
              />
              <div
                v-else
                class="space-y-2"
              >
                <div
                  v-for="key in userAccessKeysMap[user.UserName]"
                  :key="key.AccessKeyId"
                  class="flex items-center justify-between p-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
                >
                  <div>
                    <p class="text-sm text-light-text dark:text-dark-text">
                      {{ key.AccessKeyId }}
                    </p>
                    <p class="text-xs text-light-muted dark:text-dark-muted">
                      Status: {{ key.Status }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <StatusBadge
                      :status="key.Status === 'Active' ? 'active' : 'inactive'"
                      :label="key.Status"
                    />
                    <Button
                      v-if="key.Status === 'Active'"
                      variant="ghost"
                      size="sm"
                      @click.stop="openDeleteKeyModal(key.AccessKeyId, user.UserName)"
                    >
                      <template #icon-left>
                        <TrashIcon class="h-4 w-4" />
                      </template>
                    </Button>
                  </div>
                </div>
              </div>
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
          class="space-y-3"
        >
          <div
            v-for="role in roles"
            :key="role.RoleName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleRole(role.RoleName)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <ShieldCheckIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ role.RoleName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ role.Arn }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="selectRoleForAction(role, 'delete')"
                >
                  <template #icon-left>
                    <TrashIcon class="h-4 w-4" />
                  </template>
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedRoles.has(role.RoleName) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedRoles.has(role.RoleName)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Role ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ role.RoleId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ formatDate(role.CreateDate) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-between mb-3">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Attached Policies</label>
                <Button
                  variant="primary"
                  size="sm"
                  @click.stop="selectedRole = role; showAttachPolicyModal = true"
                >
                  <template #icon-left>
                    <PlusIcon class="h-4 w-4" />
                  </template>
                  Attach Policy
                </Button>
              </div>
              <EmptyState
                v-if="!rolePoliciesMap[role.RoleName] || rolePoliciesMap[role.RoleName].length === 0"
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
                  v-for="policy in rolePoliciesMap[role.RoleName]"
                  :key="policy.PolicyArn"
                  class="flex items-center justify-between p-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
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
                    @click.stop="openDetachPolicyModal(role.RoleName, policy.PolicyArn, policy.PolicyName)"
                  >
                    <template #icon-left>
                      <TrashIcon class="h-4 w-4" />
                    </template>
                  </Button>
                </div>
              </div>
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
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="togglePolicy(policy.Arn)"
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
                  v-if="!policy.Arn.startsWith('arn:aws:iam::aws:')"
                  variant="ghost"
                  size="sm"
                  @click.stop="selectedPolicy = policy; showDeletePolicyModal = true"
                >
                  <template #icon-left>
                    <TrashIcon class="h-4 w-4" />
                  </template>
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedPolicies.has(policy.Arn) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedPolicies.has(policy.Arn)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ policy.PolicyName }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                    {{ policy.Arn }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ policy.PolicyId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Attachments</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ policy.AttachmentCount }}
                  </p>
                </div>
              </div>
              <div class="mt-4">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Policy Document</label>
                <div
                  v-if="loadingPolicyDocument === policy.Arn"
                  class="flex items-center justify-center py-4"
                >
                  <LoadingSpinner size="sm" />
                </div>
                <pre
                  v-else-if="policyDocuments[policy.Arn]"
                  class="p-3 rounded-lg bg-light-bg dark:bg-dark-bg text-xs font-mono text-light-text dark:text-dark-text overflow-x-auto"
                >{{ JSON.stringify(policyDocuments[policy.Arn], null, 2) }}</pre>
                <p
                  v-else
                  class="text-xs text-light-muted dark:text-dark-muted"
                >
                  No policy document available
                </p>
              </div>
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
          class="space-y-3"
        >
          <div
            v-for="group in groups"
            :key="group.GroupName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleGroup(group.GroupName)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  <UserGroupIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ group.GroupName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ group.Arn }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="selectGroupForAction(group, 'delete')"
                >
                  <template #icon-left>
                    <TrashIcon class="h-4 w-4" />
                  </template>
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedGroups.has(group.GroupName) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedGroups.has(group.GroupName)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ group.GroupName }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">ARN</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                    {{ group.Arn }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Group ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ group.GroupId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Created</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ formatDate(group.CreateDate) }}
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-between mb-3">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase">Users</label>
                <Button
                  variant="primary"
                  size="sm"
                  @click.stop="selectedGroup = group; showAddUserToGroupModal = true"
                >
                  <template #icon-left>
                    <PlusIcon class="h-4 w-4" />
                  </template>
                  Add User
                </Button>
              </div>
              <EmptyState
                v-if="!groupUsersMap[group.GroupName] || groupUsersMap[group.GroupName].length === 0"
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
                  v-for="user in groupUsersMap[group.GroupName]"
                  :key="user.UserName"
                  class="flex items-center justify-between p-2 rounded-lg border border-light-border dark:border-dark-border bg-light-bg dark:bg-dark-bg"
                >
                  <div>
                    <p class="text-sm text-light-text dark:text-dark-text">
                      {{ user.UserName }}
                    </p>
                    <p class="text-xs text-light-muted dark:text-dark-muted">
                      {{ user.Arn }}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    @click.stop="openRemoveUserModal(group.GroupName, user.UserName)"
                  >
                    <template #icon-left>
                      <TrashIcon class="h-4 w-4" />
                    </template>
                  </Button>
                </div>
              </div>
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
      @update:open="showCreateKeyModal = $event; newAccessKey = null"
    >
      <div
        v-if="!newAccessKey"
        class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20"
      >
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          Make sure to save the Secret Access Key. It cannot be retrieved after closing this modal.
        </p>
      </div>
      <div
        v-else
        class="space-y-4"
      >
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Access Key ID</label>
          <div class="flex items-center gap-2">
            <code class="flex-1 p-2 rounded bg-light-bg dark:bg-dark-bg text-sm font-mono text-light-text dark:text-dark-text">{{ newAccessKey.AccessKeyId }}</code>
            <Button
              variant="ghost"
              size="sm"
              @click="navigator.clipboard.writeText(newAccessKey.AccessKeyId)"
            >
              <ClipboardIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Secret Access Key</label>
          <div class="flex items-center gap-2">
            <code class="flex-1 p-2 rounded bg-light-bg dark:bg-dark-bg text-sm font-mono text-light-text dark:text-dark-text">{{ newAccessKey.SecretAccessKey }}</code>
            <Button
              variant="ghost"
              size="sm"
              @click="navigator.clipboard.writeText(newAccessKey.SecretAccessKey)"
            >
              <ClipboardIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div class="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
          <p class="text-sm text-yellow-800 dark:text-yellow-200">
            Make sure to save the Secret Access Key. It cannot be retrieved after closing this modal.
          </p>
        </div>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showCreateKeyModal = false; newAccessKey = null"
        >
          {{ newAccessKey ? 'Close' : 'Cancel' }}
        </Button>
        <Button
          v-if="!newAccessKey"
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
      title="Attach Policy to Role"
      size="lg"
      @update:open="showAttachPolicyModal = $event"
      @open="loadAllPolicies"
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

    <!-- Delete Policy Confirmation -->
    <ConfirmModal
      v-model:open="showDeletePolicyModal"
      title="Delete Policy"
      :message="`Are you sure you want to delete policy '${selectedPolicy?.PolicyName}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDeletePolicy"
    />

    <!-- Detach Policy Confirmation -->
    <ConfirmModal
      v-model:open="showDetachPolicyModal"
      title="Detach Policy"
      :message="`Are you sure you want to detach policy '${policyToDetach?.policyName}' from role '${policyToDetach?.roleName}'?`"
      confirm-text="Detach"
      @confirm="handleDetachPolicy"
    />

    <!-- Delete Access Key Confirmation -->
    <ConfirmModal
      v-model:open="showDeleteKeyModal"
      title="Delete Access Key"
      :message="`Are you sure you want to delete access key '${keyToDelete?.accessKeyId}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDeleteAccessKeyConfirm"
    />

    <!-- Create Policy Modal -->
    <Modal
      :open="showCreatePolicyModal"
      title="Create Policy"
      size="lg"
      @update:open="showCreatePolicyModal = $event"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newPolicy.PolicyName"
          label="Policy Name"
          placeholder="MyPolicy"
        />
        <div>
          <label class="block text-sm font-medium mb-1 text-light-text dark:text-dark-text">
            Policy Document (JSON)
          </label>
          <textarea
            v-model="newPolicy.PolicyDocument"
            rows="10"
            class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border font-mono text-sm"
            placeholder="{&quot;Version&quot;: &quot;2012-10-17&quot;, &quot;Statement&quot;: [{&quot;Effect&quot;: &quot;Allow&quot;, &quot;Action&quot;: [&quot;s3:GetObject&quot;], &quot;Resource&quot;: &quot;*&quot;}]}"
          />
          <p class="text-xs text-light-muted dark:text-dark-muted mt-1">
            Enter the IAM policy JSON document
          </p>
        </div>
        <FormInput
          v-model="newPolicy.Description"
          label="Description (optional)"
          placeholder="My custom policy"
        />
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showCreatePolicyModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          :loading="creatingPolicy"
          @click="handleCreatePolicy"
        >
          Create Policy
        </Button>
      </template>
    </Modal>

    <!-- Add User to Group Modal -->
    <Modal
      :open="showAddUserToGroupModal"
      title="Add User to Group"
      size="md"
      @update:open="showAddUserToGroupModal = $event"
    >
      <div class="space-y-4">
        <p class="text-sm text-light-muted dark:text-dark-muted">
          Select a user to add to group "{{ selectedGroup?.GroupName }}"
        </p>
        <select
          v-model="selectedUserToAdd"
          class="w-full px-3 py-2 rounded-lg border bg-light-input dark:bg-dark-input border-light-border dark:border-dark-border"
        >
          <option value="">
            Select a user...
          </option>
          <option
            v-for="user in availableUsersForGroup"
            :key="user.UserName"
            :value="user.UserName"
          >
            {{ user.UserName }}
          </option>
        </select>
      </div>
      <template #footer>
        <Button
          variant="secondary"
          @click="showAddUserToGroupModal = false"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          :loading="addingUserToGroup"
          :disabled="!selectedUserToAdd"
          @click="handleAddUserToGroupFromList(selectedGroup?.GroupName || '')"
        >
          Add User
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
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-medium text-light-text dark:text-dark-text">
            Users in {{ selectedGroup?.GroupName }}
          </h3>
          <Button
            v-if="availableUsersForGroup.length > 0"
            variant="primary"
            size="sm"
            @click="showAddUserToGroupModal = true"
          >
            <template #icon-left>
              <PlusIcon class="h-4 w-4" />
            </template>
            Add User
          </Button>
        </div>
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
            <Button
              variant="ghost"
              size="sm"
              :loading="removingUserFromGroup"
              @click="openRemoveUserModal(selectedGroup?.GroupName || '', user.UserName)"
            >
              <template #icon-left>
                <TrashIcon class="h-4 w-4" />
              </template>
            </Button>
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

    <!-- Remove User from Group Confirmation -->
    <ConfirmModal
      v-model:open="showRemoveUserModal"
      title="Remove User from Group"
      :message="`Are you sure you want to remove user '${userToRemove?.userName}' from group '${userToRemove?.groupName}'? This action cannot be undone.`"
      confirm-text="Remove"
      @confirm="handleRemoveUserFromGroup"
    />

    <!-- Create Group Modal -->
    <Modal
      :open="showCreateGroupModal"
      title="Create Group"
      size="md"
      @update:open="showCreateGroupModal = $event"
    >
      <div class="space-y-4">
        <FormInput
          v-model="newGroup.GroupName"
          label="Group Name"
          placeholder="my-group"
          required
        />
        <FormInput
          v-model="newGroup.Path"
          label="Path (optional)"
          placeholder="/"
          help-text="The path for the group"
        />
      </div>
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

    <!-- Delete Group Confirmation -->
    <ConfirmModal
      v-model:open="showDeleteGroupModal"
      title="Delete Group"
      :message="`Are you sure you want to delete group '${groupToDelete?.GroupName}'? This action cannot be undone.`"
      confirm-text="Delete"
      @confirm="handleDeleteGroup"
    />
  </div>
</template>
