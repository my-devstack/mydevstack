import { ref } from 'vue'
import { useUIStore } from '@/stores/ui'
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
  const uiStore = useUIStore()

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
      users.value = result.Users
    } catch (error) {
      uiStore.notifyError('Failed to load users', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      loading.value = false
    }
  }

  async function createUser(userName: string, path?: string) {
    await iamApi.createUser({ UserName: userName, Path: path })
    uiStore.notifySuccess('User created', `User "${userName}" created successfully`)
    await loadUsers()
  }

  async function deleteUser(userName: string) {
    await iamApi.deleteUser(userName)
    uiStore.notifySuccess('User deleted', `User "${userName}" deleted successfully`)
    await loadUsers()
  }

  async function loadUserAccessKeys(userName: string): Promise<AccessKeyInfo[]> {
    try {
      const result = await iamApi.listAccessKeys(userName)
      const keys = result.AccessKeyMetadata || []
      userAccessKeysMap.value[userName] = keys
      return keys
    } catch (error) {
      console.error('Failed to load access keys:', error)
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
    uiStore.notifySuccess('Access key deleted', 'Access key deleted successfully')
    await loadUserAccessKeys(userName)
  }

  async function loadRoles() {
    loading.value = true
    try {
      const result = await iamApi.listRoles()
      roles.value = result.Roles
    } catch (error) {
      uiStore.notifyError('Failed to load roles', error instanceof Error ? error.message : 'Unknown error')
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
    uiStore.notifySuccess('Role created', `Role "${roleName}" created successfully`)
    await loadRoles()
  }

  async function deleteRole(roleName: string) {
    await iamApi.deleteRole(roleName)
    uiStore.notifySuccess('Role deleted', `Role "${roleName}" deleted successfully`)
    await loadRoles()
  }

  async function loadRolePolicies(roleName: string): Promise<AttachedPolicy[]> {
    try {
      const result = await iamApi.listAttachedRolePolicies(roleName)
      const policies = result.AttachedPolicies || []
      rolePoliciesMap.value[roleName] = policies
      return policies
    } catch (error) {
      console.error('Failed to load role policies:', error)
      return []
    }
  }

  async function loadAllPolicies(): Promise<IAMPolicy[]> {
    const result = await iamApi.listPolicies({ Scope: 'All' })
    return result.Policies
  }

  async function attachPolicy(roleName: string, policyArn: string) {
    await iamApi.attachRolePolicy(roleName, policyArn)
    uiStore.notifySuccess('Policy attached', 'Policy attached successfully')
    await loadRolePolicies(roleName)
  }

  async function detachPolicy(roleName: string, policyArn: string) {
    await iamApi.detachRolePolicy(roleName, policyArn)
    uiStore.notifySuccess('Policy detached', 'Policy detached successfully')
    await loadRolePolicies(roleName)
  }

  async function loadPolicies() {
    loading.value = true
    try {
      const result = await iamApi.listPolicies({ Scope: 'All' })
      policies.value = result.Policies
    } catch (error) {
      uiStore.notifyError('Failed to load policies', error instanceof Error ? error.message : 'Unknown error')
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
      console.error('Failed to load policy document:', error)
    }
  }

  async function deletePolicy(policyArn: string, policyName: string) {
    await iamApi.deletePolicy(policyArn)
    uiStore.notifySuccess('Policy deleted', `Policy "${policyName}" deleted`)
    expandedPolicies.value.delete(policyArn)
    await loadPolicies()
  }

  async function createPolicy(policyName: string, policyDocument: string, description?: string) {
    await iamApi.createPolicy({
      PolicyName: policyName,
      PolicyDocument: policyDocument,
      Description: description,
    })
    uiStore.notifySuccess('Policy created', `Policy "${policyName}" created successfully`)
    await loadPolicies()
  }

  async function loadGroups() {
    loading.value = true
    try {
      const result = await iamApi.listGroups()
      groups.value = result.Groups
    } catch (error) {
      uiStore.notifyError('Failed to load groups', error instanceof Error ? error.message : 'Unknown error')
    } finally {
      loading.value = false
    }
  }

  async function createGroup(groupName: string, path?: string) {
    await iamApi.createGroup(groupName, path)
    uiStore.notifySuccess('Group created', `Group "${groupName}" created successfully`)
    await loadGroups()
  }

  async function deleteGroup(groupName: string) {
    await iamApi.deleteGroup(groupName)
    uiStore.notifySuccess('Group deleted', `Group "${groupName}" deleted successfully`)
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
      console.error('Failed to load group users:', error)
      return []
    }
  }

  async function addUserToGroup(groupName: string, userName: string) {
    await iamApi.addUserToGroup(groupName, userName)
    uiStore.notifySuccess('User added', `User "${userName}" added to group`)
    await loadGroupUsers(groupName)
  }

  async function removeUserFromGroup(groupName: string, userName: string) {
    await iamApi.removeUserFromGroup(groupName, userName)
    uiStore.notifySuccess('User removed', `User "${userName}" removed from group`)
    await loadGroupUsers(groupName)
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  async function loadAll() {
    await Promise.all([loadUsers(), loadRoles(), loadPolicies(), loadGroups()])
  }

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