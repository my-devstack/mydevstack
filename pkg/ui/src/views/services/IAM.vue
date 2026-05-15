<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useToast } from '@/composables/useToast'
import Button from '@/components/common/Button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Tabs from '@/components/common/Tabs.vue'
import {
  IAMCreateUserModal,
  IAMCreateRoleModal,
  IAMCreateGroupModal,
  IAMCreatePolicyModal,
  IAMCreateKeyModal,
  IAMDeleteModal,
  IAMDeleteRoleModal,
  IAMDeleteGroupModal,
  IAMDeletePolicyModal,
  IAMDeleteAccessKeyModal,
  IAMUserKeysModal,
  IAMRolePoliciesModal,
  IAMAttachPolicyModal,
  IAMPolicyDetailsModal,
  IAMGroupUsersModal,
  IAMAddUserToGroupModal,
  IAMDetachPolicyModal,
  IAMRemoveUserFromGroupModal,
} from '@/components/iam'
import CodeSnippet from '@/components/common/CodeSnippet.vue'
import {
  UserIcon,
  ShieldCheckIcon,
  KeyIcon,
  UserGroupIcon,
  PlusIcon,
  TrashIcon,
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
import { useIAM } from '@/composables/useIAM'

// Components
const settingsStore = useSettingsStore()
const toast = useToast()
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

// Tabs
const tabs = [
  { id: 'users', label: 'Users', icon: UserIcon },
  { id: 'roles', label: 'Roles', icon: ShieldCheckIcon },
  { id: 'policies', label: 'Policies', icon: KeyIcon },
  { id: 'groups', label: 'Groups', icon: UserGroupIcon },
]

// Pagination for users
const {
  currentPage: userPage,
  itemsPerPage: usersPerPage,
  totalPages: totalUserPages,
  paginatedItems: paginatedUsers,
  goToPage: goToUserPage,
  perPageOptions,
} = usePagination(users, { defaultPerPage: 10 })

// Pagination for roles
const {
  currentPage: rolePage,
  itemsPerPage: rolesPerPage,
  totalPages: totalRolePages,
  paginatedItems: paginatedRoles,
  goToPage: goToRolePage,
} = usePagination(roles, { defaultPerPage: 10 })

// Pagination for policies
const {
  currentPage: policyPage,
  itemsPerPage: policiesPerPage,
  totalPages: totalPolicyPages,
  paginatedItems: paginatedPolicies,
  goToPage: goToPolicyPage,
} = usePagination(policies, { defaultPerPage: 10 })

// Pagination for groups
const {
  currentPage: groupPage,
  itemsPerPage: groupsPerPage,
  totalPages: totalGroupPages,
  paginatedItems: paginatedGroups,
  goToPage: goToGroupPage,
} = usePagination(groups, { defaultPerPage: 10 })

// Computed
const userCount = computed(() => users.value.length)
const roleCount = computed(() => roles.value.length)
const policyCount = computed(() => policies.value.length)
const groupCount = computed(() => groups.value.length)

const { codeExamples } = useIAM()

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
    toast.error('Failed to load users: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateUser(data: { UserName: string; Path?: string }) {
  if (!data.UserName.trim()) {
    toast.error('Username is required')
    return
  }

  try {
    await createUser({
      UserName: data.UserName,
      Path: data.Path,
    })
    toast.success(`User "${data.UserName}" created successfully`)
    showCreateUserModal.value = false
    await loadUsers()
  } catch (error) {
    toast.error('Failed to create user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteUser() {
  if (!selectedUser.value) return

  try {
    await deleteUser(selectedUser.value.UserName)
    toast.success(`User "${selectedUser.value.UserName}" deleted successfully`)
    showDeleteUserModal.value = false
    selectedUser.value = null
    await loadUsers()
  } catch (error) {
    toast.error('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function loadUserAccessKeys() {
  if (!selectedUser.value) return

  try {
    const result = await listAccessKeys(selectedUser.value.UserName)
    userAccessKeys.value = result.AccessKeyMetadata || []
  } catch (error) {
    toast.error('Failed to load access keys: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.error('Failed to create access key: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteAccessKey(keyId: string) {
  if (!selectedUser.value) return

  try {
    await deleteAccessKey(keyId, selectedUser.value.UserName)
    toast.success('Access key deleted successfully')
    await loadUserAccessKeys()
  } catch (error) {
    toast.error('Failed to delete access key: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.success(`Access key "${keyToDelete.value.accessKeyId}" deleted`)
    showDeleteKeyModal.value = false
    const result = await listAccessKeys(keyToDelete.value.userName)
    userAccessKeysMap.value[keyToDelete.value.userName] = result.AccessKeyMetadata || []
    keyToDelete.value = null
  } catch (error) {
    toast.error('Failed to delete access key: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.error('Failed to load roles: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateRole(data: { RoleName: string; Description?: string; AssumeRolePolicyDocument: string }) {
  if (!data.RoleName.trim()) {
    toast.error('Role name is required')
    return
  }

  try {
    await createRole({
      RoleName: data.RoleName,
      Description: data.Description,
      AssumeRolePolicyDocument: data.AssumeRolePolicyDocument,
    })
    toast.success(`Role "${data.RoleName}" created successfully`)
    showCreateRoleModal.value = false
    await loadRoles()
  } catch (error) {
    toast.error('Failed to create role: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteRole() {
  if (!selectedRole.value) return

  try {
    await deleteRole(selectedRole.value.RoleName)
    toast.success(`Role "${selectedRole.value.RoleName}" deleted successfully`)
    showDeleteRoleModal.value = false
    selectedRole.value = null
    await loadRoles()
  } catch (error) {
    toast.error('Failed to delete role: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.success('Policy attached successfully')
    const result = await listAttachedRolePolicies(selectedRole.value.RoleName)
    rolePoliciesMap.value[selectedRole.value.RoleName] = result.AttachedPolicies || []
    showAttachPolicyModal.value = false
  } catch (error) {
    toast.error('Failed to attach policy: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.success('Policy detached successfully')
    showDetachPolicyModal.value = false
    const result = await listAttachedRolePolicies(roleName)
    rolePoliciesMap.value[roleName] = result.AttachedPolicies || []
    policyToDetach.value = null
  } catch (error) {
    toast.error('Failed to detach policy: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.error('Failed to load policies: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.success(`Policy "${selectedPolicy.value.PolicyName}" deleted`)
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
    toast.error('Failed to delete policy: ' + message)
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

async function handleCreatePolicy(data: { PolicyName: string; PolicyDocument: string; Description?: string }) {
  if (!data.PolicyName.trim() || !data.PolicyDocument.trim()) {
    toast.error('Policy name and policy document are required')
    return
  }
  creatingPolicy.value = true
  try {
    await createPolicy({
      PolicyName: data.PolicyName,
      PolicyDocument: data.PolicyDocument,
      Description: data.Description,
    })
    toast.success(`Policy "${data.PolicyName}" created successfully`)
    showCreatePolicyModal.value = false
    await loadPolicies()
  } catch (error) {
    toast.error('Failed to create policy: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.error('Failed to load groups: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    isLoading.value = false
  }
}

async function handleCreateGroup(data: { GroupName: string; Path?: string }) {
  if (!data.GroupName.trim()) {
    toast.error('Group name is required')
    return
  }

  try {
    await createGroup(data.GroupName, data.Path)
    toast.success(`Group "${data.GroupName}" created successfully`)
    showCreateGroupModal.value = false
    await loadGroups()
  } catch (error) {
    toast.error('Failed to create group: ' + (error instanceof Error ? error.message : 'Unknown error'))
  }
}

async function handleDeleteGroup() {
  if (!groupToDelete.value) return

  const groupName = groupToDelete.value.GroupName
  try {
    await deleteGroup(groupToDelete.value.GroupName)
    toast.success(`Group "${groupName}" deleted successfully`)
    showDeleteGroupModal.value = false
    expandedGroups.value.delete(groupName)
    groupToDelete.value = null
    await loadGroups()
  } catch (error) {
    toast.error('Failed to delete group: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.success(`User "${selectedUserToAdd.value}" added to group`)
    selectedUserToAdd.value = ''
    showAddUserToGroupModal.value = false
    await loadGroupUsers()
  } catch (error) {
    toast.error('Failed to add user: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
    toast.success(`User "${userName}" removed from group`)
    showRemoveUserModal.value = false
    const result = await listUsersForGroup(groupName)
    groupUsersMap.value[groupName] = result.Users || []
    userToRemove.value = null
  } catch (error) {
    toast.error('Failed to remove user: ' + (error instanceof Error ? error.message : 'Unknown error'))
  } finally {
    removingUserFromGroup.value = false
  }
}

async function handleAddUserToGroupFromList(groupName: string) {
  if (!selectedUserToAdd.value) return
  addingUserToGroup.value = true
  try {
    await addUserToGroup(groupName, selectedUserToAdd.value)
    toast.success(`User "${selectedUserToAdd.value}" added to group`)
    selectedUserToAdd.value = ''
    showAddUserToGroupModal.value = false
    const result = await listUsersForGroup(groupName)
    groupUsersMap.value[groupName] = result.Users || []
  } catch (error) {
    toast.error('Failed to add user: ' + (error instanceof Error ? error.message : 'Unknown error'))
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
            v-for="user in paginatedUsers"
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
          <!-- Pagination -->
          <div
            v-if="users.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="usersPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div v-if="totalUserPages > 1" class="flex items-center gap-2">
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="userPage === 1"
                @click="goToUserPage(userPage - 1)"
              >Previous</button>
              <span class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                Page {{ userPage }} of {{ totalUserPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="userPage === totalUserPages"
                @click="goToUserPage(userPage + 1)"
              >Next</button>
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
            v-for="role in paginatedRoles"
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
                  @click.stop="selectedRole = role; openAttachPolicy()"
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
          <!-- Pagination -->
          <div
            v-if="roles.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="rolesPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div v-if="totalRolePages > 1" class="flex items-center gap-2">
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="rolePage === 1"
                @click="goToRolePage(rolePage - 1)"
              >Previous</button>
              <span class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                Page {{ rolePage }} of {{ totalRolePages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="rolePage === totalRolePages"
                @click="goToRolePage(rolePage + 1)"
              >Next</button>
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
            v-for="policy in paginatedPolicies"
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
          <!-- Pagination -->
          <div
            v-if="policies.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="policiesPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div v-if="totalPolicyPages > 1" class="flex items-center gap-2">
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="policyPage === 1"
                @click="goToPolicyPage(policyPage - 1)"
              >Previous</button>
              <span class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                Page {{ policyPage }} of {{ totalPolicyPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="policyPage === totalPolicyPages"
                @click="goToPolicyPage(policyPage + 1)"
              >Next</button>
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
            v-for="group in paginatedGroups"
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
          <!-- Pagination -->
          <div
            v-if="groups.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="groupsPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div v-if="totalGroupPages > 1" class="flex items-center gap-2">
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="groupPage === 1"
                @click="goToGroupPage(groupPage - 1)"
              >Previous</button>
              <span class="text-sm" :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'">
                Page {{ groupPage }} of {{ totalGroupPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="groupPage === totalGroupPages"
                @click="goToGroupPage(groupPage + 1)"
              >Next</button>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Create User Modal -->
    <IAMCreateUserModal
      :open="showCreateUserModal"
      @update:open="showCreateUserModal = $event"
      @create="handleCreateUser"
    />

    <!-- Delete User Modal -->
    <IAMDeleteModal
      :open="showDeleteUserModal"
      title="Delete User"
      :message="`Are you sure you want to delete user '${selectedUser?.UserName}'? This action cannot be undone.`"
      @update:open="showDeleteUserModal = $event"
      @confirm="handleDeleteUser"
    />

    <!-- User Access Keys Modal -->
    <IAMUserKeysModal
      :open="showUserKeysModal"
      :user-name="selectedUser?.UserName || ''"
      :access-keys="userAccessKeys"
      :format-date="formatDate"
      @update:open="showUserKeysModal = $event"
      @create-key="showCreateKeyModal = true"
      @delete-key="handleDeleteAccessKey"
    />

    <!-- Create Access Key Modal -->
    <IAMCreateKeyModal
      :open="showCreateKeyModal"
      :new-access-key="newAccessKey"
      @update:open="showCreateKeyModal = $event"
      @create="handleCreateAccessKey"
    />

    <!-- Create Role Modal -->
    <IAMCreateRoleModal
      :open="showCreateRoleModal"
      @update:open="showCreateRoleModal = $event"
      @create="handleCreateRole"
    />

    <!-- Delete Role Modal -->
    <IAMDeleteRoleModal
      :open="showDeleteRoleModal"
      :role-name="selectedRole?.RoleName || ''"
      @update:open="showDeleteRoleModal = $event"
      @confirm="handleDeleteRole"
    />

    <!-- Role Policies Modal -->
    <IAMRolePoliciesModal
      :open="showRolePoliciesModal"
      :role-name="selectedRole?.RoleName || ''"
      :policies="rolePolicies"
      @update:open="showRolePoliciesModal = $event"
      @open-attach="openAttachPolicy"
      @detach-policy="handleDetachPolicy"
    />

    <!-- Attach Policy Modal -->
    <IAMAttachPolicyModal
      :open="showAttachPolicyModal"
      :policies="allPolicies"
      @update:open="showAttachPolicyModal = $event"
      @attach="handleAttachPolicy"
    />

    <!-- Policy Details Modal -->
    <IAMPolicyDetailsModal
      :open="showPolicyModal"
      :policy="selectedPolicy"
      @update:open="showPolicyModal = $event"
    />

    <!-- Delete Policy Confirmation -->
    <IAMDeletePolicyModal
      :open="showDeletePolicyModal"
      :policy-name="selectedPolicy?.PolicyName || ''"
      @update:open="showDeletePolicyModal = $event"
      @confirm="handleDeletePolicy"
    />

    <!-- Detach Policy Confirmation -->
    <IAMDetachPolicyModal
      :open="showDetachPolicyModal"
      :policy-name="policyToDetach?.policyName || ''"
      :role-name="policyToDetach?.roleName || ''"
      @update:open="showDetachPolicyModal = $event"
      @confirm="handleDetachPolicy"
    />

    <!-- Delete Access Key Confirmation -->
    <IAMDeleteAccessKeyModal
      :open="showDeleteKeyModal"
      :access-key-id="keyToDelete?.accessKeyId || ''"
      @update:open="showDeleteKeyModal = $event"
      @confirm="handleDeleteAccessKeyConfirm"
    />

    <!-- Create Policy Modal -->
    <IAMCreatePolicyModal
      :open="showCreatePolicyModal"
      @update:open="showCreatePolicyModal = $event"
      @create="handleCreatePolicy"
    />

    <!-- Add User to Group Modal -->
    <IAMAddUserToGroupModal
      v-model:selected-user="selectedUserToAdd"
      :open="showAddUserToGroupModal"
      :group-name="selectedGroup?.GroupName || ''"
      :users="availableUsersForGroup"
      :loading="addingUserToGroup"
      @update:open="showAddUserToGroupModal = $event"
      @add="handleAddUserToGroupFromList(selectedGroup?.GroupName || '')"
    />

    <!-- Group Users Modal -->
    <IAMGroupUsersModal
      :open="showGroupUsersModal"
      :group-name="selectedGroup?.GroupName || ''"
      :users="groupUsers"
      :available-users="availableUsersForGroup"
      @update:open="showGroupUsersModal = $event"
      @add-user="showAddUserToGroupModal = true"
      @remove-user="openRemoveUserModal(selectedGroup?.GroupName || '', $event)"
    />

    <!-- Remove User from Group Confirmation -->
    <IAMRemoveUserFromGroupModal
      :open="showRemoveUserModal"
      :user-name="userToRemove?.userName || ''"
      :group-name="userToRemove?.groupName || ''"
      @update:open="showRemoveUserModal = $event"
      @confirm="handleRemoveUserFromGroup"
    />

    <!-- Create Group Modal -->
    <IAMCreateGroupModal
      :open="showCreateGroupModal"
      @update:open="showCreateGroupModal = $event"
      @create="handleCreateGroup"
    />

    <!-- Delete Group Confirmation -->
    <IAMDeleteGroupModal
      :open="showDeleteGroupModal"
      :group-name="groupToDelete?.GroupName || ''"
      @update:open="showDeleteGroupModal = $event"
      @confirm="handleDeleteGroup"
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
