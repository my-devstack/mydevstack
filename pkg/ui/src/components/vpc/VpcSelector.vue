<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  FormSelect,
  LoadingSpinner,
  EmptyState,
} from '@/components/common'
import { useVpcSelector } from '@/composables/useVpcSelector'
import type { VpcSelection, VpcResourceType } from '@/types/vpc'

interface Props {
  modelValue: VpcSelection | null
  resourceType?: VpcResourceType
  required?: boolean
  showSubnet?: boolean
  showSecurityGroup?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  resourceType: 'ec2',
  required: false,
  showSubnet: true,
  showSecurityGroup: true,
  label: 'VPC Configuration',
})

const emit = defineEmits<{
  'update:modelValue': [value: VpcSelection | null]
}>()

// ── Composable ─────────────────────────────────────────────

const {
  vpcs,
  subnets,
  securityGroups,
  loading,
  error,
  selectedVpcId,
  subnetsLoading,
  sgsLoading,
  loadVpcList,
} = useVpcSelector(props.resourceType)

// Sync initial modelValue
if (props.modelValue?.vpcId) {
  selectedVpcId.value = props.modelValue.vpcId
}
const selectedSubnetIds = ref<string[]>(props.modelValue?.subnetIds || [])
const selectedSecurityGroupIds = ref<string[]>(props.modelValue?.securityGroupIds || [])

onMounted(() => {
  loadVpcList()
})

// ── Computed options ───────────────────────────────────────

const vpcOptions = computed(() =>
  vpcs.value.map((v) => ({
    value: v.VpcId,
    label: `${v.VpcId} (${v.CidrBlock})${v.IsDefault ? ' — default' : ''}`,
  })),
)

const subnetOptions = computed(() =>
  subnets.value.map((s: any) => ({
    value: s.SubnetId || s.DBSubnetGroupName || s.CacheSubnetGroupName || '',
    label: s.SubnetId
      ? `${s.SubnetId} (${s.CidrBlock}, ${s.AvailabilityZone})`
      : s.DBSubnetGroupName
        ? `${s.DBSubnetGroupName}${s.DBSubnetGroupDescription ? ` — ${s.DBSubnetGroupDescription}` : ''}`
        : s.CacheSubnetGroupName || '',
  })),
)

const sgOptions = computed(() =>
  securityGroups.value.map((sg: any) => ({
    value: sg.GroupId || sg.CacheSecurityGroupId || '',
    label: `${sg.GroupName || sg.CacheSecurityGroupName || ''} (${sg.GroupId || sg.CacheSecurityGroupId || ''})`,
  })),
)

const isMultiSubnet = computed(() =>
  ['msk', 'opensearch', 'lambda'].includes(props.resourceType),
)

const isRds = computed(() => props.resourceType === 'rds')

const isElasticache = computed(() => props.resourceType === 'elasticache')

// ── Validation ─────────────────────────────────────────────

const validationError = computed(() => {
  if (props.required && !selectedVpcId.value) {
    return 'This field is required'
  }
  return null
})

// ── Emit helpers ───────────────────────────────────────────

function emitSelection() {
  if (!selectedVpcId.value) {
    emit('update:modelValue', null)
    return
  }
  emit('update:modelValue', {
    vpcId: selectedVpcId.value,
    subnetIds: selectedSubnetIds.value,
    securityGroupIds: selectedSecurityGroupIds.value,
  })
}

// ── Watch VPC change → clear children ──────────────────────

watch(selectedVpcId, () => {
  selectedSubnetIds.value = []
  selectedSecurityGroupIds.value = []
  emitSelection()
})

// ── Handlers ───────────────────────────────────────────────

function onVpcChange(vpcId: string) {
  selectedVpcId.value = vpcId
}

function onSubnetChange(subnetValue: string) {
  selectedSubnetIds.value = subnetValue ? [subnetValue] : []
  emitSelection()
}

function toggleSubnet(subnetId: string) {
  const idx = selectedSubnetIds.value.indexOf(subnetId)
  if (idx >= 0) {
    selectedSubnetIds.value = selectedSubnetIds.value.filter((id) => id !== subnetId)
  } else {
    selectedSubnetIds.value = [...selectedSubnetIds.value, subnetId]
  }
  emitSelection()
}

function toggleSecurityGroup(sgId: string) {
  const idx = selectedSecurityGroupIds.value.indexOf(sgId)
  if (idx >= 0) {
    selectedSecurityGroupIds.value = selectedSecurityGroupIds.value.filter((id) => id !== sgId)
  } else {
    selectedSecurityGroupIds.value = [...selectedSecurityGroupIds.value, sgId]
  }
  emitSelection()
}

// ── State helpers ──────────────────────────────────────────

const isLoading = computed(() => loading.value || subnetsLoading.value || sgsLoading.value)

const subnetLabel = computed(() => {
  if (isRds.value) return 'DB Subnet Group'
  if (isElasticache.value) return 'Cache Subnet Group'
  if (isMultiSubnet.value) return 'Subnets'
  return 'Subnet'
})

const subnetPlaceholder = computed(() => {
  if (isRds.value) return 'Select DB subnet group…'
  if (isElasticache.value) return 'Select cache subnet group…'
  return 'Select subnet…'
})
</script>

<template>
  <div class="space-y-4">
    <!-- Section Label -->
    <div class="flex items-center justify-between">
      <h4 class="text-sm font-medium text-light-text dark:text-dark-text">
        {{ label }}
        <span
          v-if="!required"
          class="text-light-muted dark:text-dark-muted font-normal ml-1"
        >(optional)</span>
        <span
          v-if="required"
          class="text-red-500 ml-0.5"
        >*</span>
      </h4>
    </div>

    <!-- Loading state (full section) -->
    <div
      v-if="loading && vpcs.length === 0"
      class="flex justify-center py-6"
    >
      <LoadingSpinner size="md" />
    </div>

    <!-- Error state (full section) -->
    <div
      v-else-if="error && vpcs.length === 0"
      class="rounded-md bg-red-50 dark:bg-red-900/20 p-3"
    >
      <p class="text-sm text-red-600 dark:text-red-400">
        {{ error }}
      </p>
    </div>

    <!-- VPCs empty state -->
    <div
      v-else-if="!loading && vpcs.length === 0 && !error"
    >
      <EmptyState
        icon="server"
        title="No VPCs found"
        description="No VPCs available. Create one first."
        compact
      />
    </div>

    <!-- Normal state -->
    <template v-else>
      <!-- ── VPC Dropdown ──────────────────────────────── -->
      <FormSelect
        :model-value="selectedVpcId"
        label="VPC"
        :options="vpcOptions"
        placeholder="Select VPC…"
        :error="validationError"
        :required="required"
        @update:model-value="onVpcChange"
      />

      <!-- ── Subnet Section ─────────────────────────────── -->
      <div
        v-if="showSubnet && selectedVpcId"
        class="space-y-2"
      >
        <label class="block text-sm font-medium text-light-text dark:text-dark-text">
          {{ subnetLabel }}
        </label>

        <!-- Subnets loading -->
        <div
          v-if="subnetsLoading"
          class="flex items-center gap-2 py-2"
        >
          <LoadingSpinner size="sm" />
          <span class="text-xs text-light-muted dark:text-dark-muted">Loading {{ subnetLabel.toLowerCase() }}…</span>
        </div>

        <!-- Subnets empty -->
        <EmptyState
          v-else-if="!subnetsLoading && subnets.length === 0"
          icon="folder"
          title=""
          :description="`No ${subnetLabel.toLowerCase()} available for this VPC`"
          compact
        />

        <!-- Single-select subnet (ec2, rds, elasticache) -->
        <FormSelect
          v-else-if="!isMultiSubnet"
          :model-value="selectedSubnetIds[0] || ''"
          :options="subnetOptions"
          :placeholder="subnetPlaceholder"
          @update:model-value="onSubnetChange"
        />

        <!-- Multi-select subnets (msk, opensearch, lambda) -->
        <div
          v-else
          class="space-y-1.5 max-h-48 overflow-y-auto border border-light-border dark:border-dark-border rounded-md p-2"
        >
          <label
            v-for="opt in subnetOptions"
            :key="opt.value"
            class="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          >
            <input
              type="checkbox"
              :value="opt.value"
              :checked="selectedSubnetIds.includes(opt.value)"
              class="h-4 w-4 rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
              @change="toggleSubnet(opt.value)"
            >
            <span class="text-sm text-light-text dark:text-dark-text">{{ opt.label }}</span>
          </label>
        </div>
      </div>

      <!-- ── Security Group Section ──────────────────────── -->
      <div
        v-if="showSecurityGroup && selectedVpcId"
        class="space-y-2"
      >
        <label class="block text-sm font-medium text-light-text dark:text-dark-text">
          Security Groups
        </label>

        <!-- SGs loading -->
        <div
          v-if="sgsLoading"
          class="flex items-center gap-2 py-2"
        >
          <LoadingSpinner size="sm" />
          <span class="text-xs text-light-muted dark:text-dark-muted">Loading security groups…</span>
        </div>

        <!-- SGs empty -->
        <EmptyState
          v-else-if="!sgsLoading && securityGroups.length === 0"
          icon="folder"
          title=""
          description="No security groups available for this VPC"
          compact
        />

        <!-- SG checkbox list -->
        <div
          v-else
          class="space-y-1.5 max-h-48 overflow-y-auto border border-light-border dark:border-dark-border rounded-md p-2"
        >
          <label
            v-for="sg in sgOptions"
            :key="sg.value"
            class="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-light-bg dark:hover:bg-dark-bg transition-colors"
          >
            <input
              type="checkbox"
              :value="sg.value"
              :checked="selectedSecurityGroupIds.includes(sg.value)"
              class="h-4 w-4 rounded border-light-border dark:border-dark-border text-primary-500 focus:ring-primary-500"
              @change="toggleSecurityGroup(sg.value)"
            >
            <span class="text-sm text-light-text dark:text-dark-text">{{ sg.label }}</span>
          </label>
        </div>
      </div>
    </template>
  </div>
</template>
