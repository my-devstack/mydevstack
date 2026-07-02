import { ref, watch } from 'vue'
import * as vpcApi from '@/api/services/vpc'
import { describeSecurityGroups } from '@/api/services/ec2'
import { describeDBSubnetGroups } from '@/api/services/rds'
import { describeCacheSubnetGroups, describeCacheSecurityGroups } from '@/api/services/elasticache'
import type { EC2Vpc, EC2Subnet, EC2SecurityGroup } from '@/api/types/aws'
import type { VpcResourceType } from '@/types/vpc'

/**
 * Composable for VPC selection — shared across all service creation modals.
 * Resource-type aware: loads subnets/SGs from appropriate API based on resourceType.
 */
export function useVpcSelector(resourceType: VpcResourceType = 'ec2') {
  const vpcs = ref<EC2Vpc[]>([])
  const subnets = ref<any[]>([])
  const securityGroups = ref<EC2SecurityGroup[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedVpcId = ref<string>('')
  const subnetsLoading = ref(false)
  const sgsLoading = ref(false)

  // ── Load VPCs ──────────────────────────────────────────

  async function loadVpcList() {
    loading.value = true
    error.value = null
    try {
      const result = await vpcApi.describeVpcs()
      vpcs.value = result.Vpcs || []
    } catch (e: any) {
      error.value = e.message || 'Failed to load VPCs'
      vpcs.value = []
    } finally {
      loading.value = false
    }
  }

  // ── Load Subnets (resource-type aware) ─────────────────

  async function loadSubnetList(vpcId: string) {
    if (!vpcId) {
      subnets.value = []
      return
    }
    subnetsLoading.value = true
    try {
      if (resourceType === 'rds') {
        const result = await describeDBSubnetGroups()
        subnets.value = (result.DBSubnetGroups || []).filter(
          (sg: any) => sg.VpcId === vpcId,
        )
      } else if (resourceType === 'elasticache') {
        const result = await describeCacheSubnetGroups()
        subnets.value = (result.CacheSubnetGroups || []).filter(
          (sg: any) => sg.VpcId === vpcId,
        )
      } else {
        const result = await vpcApi.describeSubnets()
        subnets.value = (result.Subnets || []).filter(
          (s: EC2Subnet) => s.VpcId === vpcId,
        )
      }
    } catch (e: any) {
      // Subnet group APIs may not be implemented yet; treat as empty
      subnets.value = []
    } finally {
      subnetsLoading.value = false
    }
  }

  // ── Load Security Groups (resource-type aware) ─────────

  async function loadSecurityGroupList(vpcId: string) {
    if (!vpcId) {
      securityGroups.value = []
      return
    }
    sgsLoading.value = true
    try {
      if (resourceType === 'elasticache') {
        const result = await describeCacheSecurityGroups()
        securityGroups.value = (result.CacheSecurityGroups || []).filter(
          (sg: any) => sg.VpcId === vpcId,
        )
      } else {
        const result = await describeSecurityGroups()
        securityGroups.value = (result.SecurityGroups || []).filter(
          (sg: EC2SecurityGroup) => sg.VpcId === vpcId,
        )
      }
    } catch (e: any) {
      // Security group API may not be implemented for some types; treat as empty
      securityGroups.value = []
    } finally {
      sgsLoading.value = false
    }
  }

  // ── Watch selectedVpcId to auto-reload subnets / SGs ───

  watch(selectedVpcId, (newVpcId) => {
    error.value = null
    if (newVpcId) {
      loadSubnetList(newVpcId)
      loadSecurityGroupList(newVpcId)
    } else {
      subnets.value = []
      securityGroups.value = []
    }
  })

  return {
    vpcs,
    subnets,
    securityGroups,
    loading,
    error,
    selectedVpcId,
    subnetsLoading,
    sgsLoading,
    loadVpcList,
    loadSubnetList,
    loadSecurityGroupList,
  }
}
