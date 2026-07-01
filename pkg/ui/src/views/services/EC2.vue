<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { useContentReload } from '@/composables/useContentReload'
import { usePagination } from '@/composables/usePagination'
import { useEC2 } from '@/composables/useEC2'
import {
  PlusIcon,
  ArrowPathIcon,
  ServerIcon,
  KeyIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  Squares2X2Icon,
  RectangleGroupIcon,
  TableCellsIcon,
  GlobeAltIcon,
  ArrowRightCircleIcon,
  AdjustmentsHorizontalIcon,
  BeakerIcon,
  BoltIcon,
} from '@heroicons/vue/24/outline'
import Button from '@/components/common/Button.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import Tabs from '@/components/common/Tabs.vue'
import {
  EC2CreateInstanceModal,
  EC2KeyPairModal,
  EC2SecurityGroupModal,
  EC2DeleteModal,
  EC2CodeExamples,
  VPCCreateVpcModal,
  VPCCreateSubnetModal,
  VPCCreateRouteTableModal,
  VPCCreateIgwModal,
  VPCCreateNatGatewayModal,
  VPCCreateNaclModal,
  VPCCreateFlowLogModal,
  VPCDeleteModal,
  VPCRouteTableDetailModal,
  VPCNaclRuleModal,
} from '@/components/ec2'

// Composable
const {
  instances,
  keyPairs,
  securityGroups,
  vpcs,
  subnets,
  routeTables,
  internetGateways,
  natGateways,
  networkAcls,
  flowLogs,
  elasticIps,
  loading,
  expandedInstances,
  expandedKeyPairs,
  expandedSecurityGroups,
  expandedVpcs,
  expandedSubnets,
  expandedRouteTables,
  expandedInternetGateways,
  expandedNatGateways,
  expandedNetworkAcls,
  expandedFlowLogs,
  expandedElasticIps,
  showCreateModal,
  creating,
  showDeleteConfirm,
  itemToDelete,
  deleteType,
  showKeyPairModal,
  showSecurityGroupModal,
  showVpcModal,
  showSubnetModal,
  showRouteTableModal,
  showIgwModal,
  showNatGatewayModal,
  showNaclModal,
  showFlowLogModal,
  showRouteTableDetailModal,
  showNaclRuleModal,
  selectedRouteTable,
  selectedNacl,
  vpcCreating,
  subnetCreating,
  routeTableCreating,
  igwCreating,
  natGatewayCreating,
  naclCreating,
  flowLogCreating,
  createForm,
  loadAll,
  runInstance,
  terminateInstance,
  startInstance,
  stopInstance,
  createKeyPair,
  importKeyPair,
  deleteKeyPair,
  createSecurityGroup,
  deleteSecurityGroup,
  handleCreateVpc,
  handleDeleteVpc,
  handleCreateSubnet,
  handleDeleteSubnet,
  handleCreateRouteTable,
  handleDeleteRouteTable,
  handleCreateRoute,
  handleDeleteRoute,
  handleAssociateRouteTable,
  handleDisassociateRouteTable,
  handleCreateIgw,
  handleDeleteIgw,
  handleCreateNatGateway,
  handleDeleteNatGateway,
  handleCreateNacl,
  handleDeleteNacl,
  handleCreateNaclRule,
  handleDeleteNaclRule,
  handleCreateFlowLog,
  handleDeleteFlowLog,
  handleAllocateElasticIp,
  handleReleaseElasticIp,
  toggleInstances,
  toggleKeyPairs,
  toggleSecurityGroups,
  toggleVpcs,
  toggleSubnets,
  toggleRouteTables,
  toggleInternetGateways,
  toggleNatGateways,
  toggleNetworkAcls,
  toggleFlowLogs,
  toggleElasticIps,
  confirmDelete,
  getStatus,
  resetForm,
  codeExamples,
  openRouteTableDetail,
  openNaclRuleDetail,
} = useEC2()

// Stores
const settingsStore = useSettingsStore()
const { reloadTrigger } = useContentReload()

// Tabs
const activeTab = ref('instances')

const tabs = computed(() => {
  const allTabs = [
    { id: 'instances', label: 'Instances', icon: ServerIcon },
    { id: 'key-pairs', label: 'Key Pairs', icon: KeyIcon },
    { id: 'security-groups', label: 'Security Groups', icon: ShieldCheckIcon },
    { id: 'vpc-list', label: 'VPCs', icon: Squares2X2Icon },
    { id: 'subnet-list', label: 'Subnets', icon: RectangleGroupIcon },
    { id: 'route-tables', label: 'Route Tables', icon: TableCellsIcon },
    { id: 'internet-gateways', label: 'Internet GWs', icon: GlobeAltIcon },
    { id: 'nat-gateways', label: 'NAT Gateways', icon: ArrowRightCircleIcon },
    { id: 'network-acls', label: 'Network ACLs', icon: AdjustmentsHorizontalIcon },
    { id: 'elastic-ips', label: 'Elastic IPs', icon: BoltIcon },
  ]

  // Show Flow Logs tab only when using real AWS (not emulator)
  const isRealAws = !settingsStore.emulator || settingsStore.emulator === 'aws'
  if (isRealAws) {
    allTabs.push({ id: 'flow-logs', label: 'Flow Logs', icon: BeakerIcon })
  }

  return allTabs
})

// Pagination
const {
  currentPage: instancePage,
  itemsPerPage: instancesPerPage,
  totalPages: totalInstancePages,
  paginatedItems: paginatedInstances,
  goToPage: goToInstancePage,
  perPageOptions,
} = usePagination(instances, { defaultPerPage: 10 })

const {
  currentPage: keyPairPage,
  itemsPerPage: keyPairsPerPage,
  totalPages: totalKeyPairPages,
  paginatedItems: paginatedKeyPairs,
  goToPage: goToKeyPairPage,
} = usePagination(keyPairs, { defaultPerPage: 10 })

const {
  currentPage: sgPage,
  itemsPerPage: sgPerPage,
  totalPages: totalSgPages,
  paginatedItems: paginatedSecurityGroups,
  goToPage: goToSgPage,
} = usePagination(securityGroups, { defaultPerPage: 10 })

// Key pair modal state
const newKeyMaterial = ref<string | null>(null)
const keyPairCreating = ref(false)

const {
  currentPage: vpcPage,
  itemsPerPage: vpcsPerPage,
  totalPages: totalVpcPages,
  paginatedItems: paginatedVpcs,
  goToPage: goToVpcPage,
} = usePagination(vpcs, { defaultPerPage: 10 })

const {
  currentPage: subnetPage,
  itemsPerPage: subnetsPerPage,
  totalPages: totalSubnetPages,
  paginatedItems: paginatedSubnets,
  goToPage: goToSubnetPage,
} = usePagination(subnets, { defaultPerPage: 10 })

const {
  currentPage: rtPage,
  itemsPerPage: rtPerPage,
  totalPages: totalRtPages,
  paginatedItems: paginatedRouteTables,
  goToPage: goToRtPage,
} = usePagination(routeTables, { defaultPerPage: 10 })

const {
  currentPage: igwPage,
  itemsPerPage: igwPerPage,
  totalPages: totalIgwPages,
  paginatedItems: paginatedIgws,
  goToPage: goToIgwPage,
} = usePagination(internetGateways, { defaultPerPage: 10 })

const {
  currentPage: natPage,
  itemsPerPage: natPerPage,
  totalPages: totalNatPages,
  paginatedItems: paginatedNatGateways,
  goToPage: goToNatPage,
} = usePagination(natGateways, { defaultPerPage: 10 })

const {
  currentPage: naclPage,
  itemsPerPage: naclPerPage,
  totalPages: totalNaclPages,
  paginatedItems: paginatedNacls,
  goToPage: goToNaclPage,
} = usePagination(networkAcls, { defaultPerPage: 10 })

const {
  currentPage: flowLogPage,
  itemsPerPage: flowLogPerPage,
  totalPages: totalFlowLogPages,
  paginatedItems: paginatedFlowLogs,
  goToPage: goToFlowLogPage,
} = usePagination(flowLogs, { defaultPerPage: 10 })

const {
  currentPage: eipPage,
  itemsPerPage: eipsPerPage,
  totalPages: totalEipPages,
  paginatedItems: paginatedElasticIps,
  goToPage: goToEipPage,
} = usePagination(elasticIps, { defaultPerPage: 10 })

const deleting = ref(false)

// Security group creation
const sgCreating = ref(false)
async function handleCreateSecurityGroup(params: any) {
  sgCreating.value = true
  try {
    await createSecurityGroup(params)
    showSecurityGroupModal.value = false
  } finally {
    sgCreating.value = false
  }
}

// Instance actions
async function handleStartInstance(instanceId: string) {
  await startInstance(instanceId)
}

async function handleStopInstance(instanceId: string) {
  await stopInstance(instanceId)
}

async function handleTerminateInstance(instance: any) {
  confirmDelete(instance, 'instance')
}

// Key pair actions
async function handleCreateKeyPair(keyName: string) {
  keyPairCreating.value = true
  try {
    const result = await createKeyPair(keyName)
    if (result?.KeyMaterial) {
      newKeyMaterial.value = result.KeyMaterial
    } else {
      newKeyMaterial.value = null
      showKeyPairModal.value = false
    }
  } catch {
    // error handled in composable
  } finally {
    keyPairCreating.value = false
  }
}

async function handleImportKeyPair(keyName: string, publicKeyMaterial: string) {
  keyPairCreating.value = true
  try {
    await importKeyPair(keyName, publicKeyMaterial)
    showKeyPairModal.value = false
    newKeyMaterial.value = null
  } catch {
    // error handled in composable
  } finally {
    keyPairCreating.value = false
  }
}

// Delete handler
async function handleDelete() {
  deleting.value = true
  try {
    if (deleteType.value === 'instance') {
      await terminateInstance()
    } else if (deleteType.value === 'keypair') {
      await deleteKeyPair()
    } else if (deleteType.value === 'secgroup') {
      await deleteSecurityGroup()
    } else if (deleteType.value === 'vpc') {
      await handleDeleteVpc()
    } else if (deleteType.value === 'subnet') {
      await handleDeleteSubnet()
    } else if (deleteType.value === 'routetable') {
      await handleDeleteRouteTable()
    } else if (deleteType.value === 'igw') {
      await handleDeleteIgw()
    } else if (deleteType.value === 'natgw') {
      await handleDeleteNatGateway()
    } else if (deleteType.value === 'nacl') {
      await handleDeleteNacl()
    } else if (deleteType.value === 'flowlog') {
      await handleDeleteFlowLog()
    } else if (deleteType.value === 'eip') {
      await handleReleaseElasticIp()
    }
  } finally {
    deleting.value = false
  }
}

function openDeleteConfirm(item: any, type: 'instance' | 'keypair' | 'secgroup' | 'vpc' | 'subnet' | 'routetable' | 'igw' | 'natgw' | 'nacl' | 'flowlog' | 'eip') {
  confirmDelete(item, type)
}

// Counts
const instanceCount = computed(() => instances.value.length)
const keyPairCount = computed(() => keyPairs.value.length)
const sgCount = computed(() => securityGroups.value.length)
const vpcCount = computed(() => vpcs.value.length)
const subnetCount = computed(() => subnets.value.length)
const rtCount = computed(() => routeTables.value.length)
const igwCount = computed(() => internetGateways.value.length)
const natCount = computed(() => natGateways.value.length)
const naclCount = computed(() => networkAcls.value.length)
const flowLogCount = computed(() => flowLogs.value.length)
const eipCount = computed(() => elasticIps.value.length)

// Format helper
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString()
}

// Lifecycle
onMounted(() => {
  loadAll()
})

watch(reloadTrigger, () => {
  loadAll()
})
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 border-b border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <ServerIcon class="h-6 w-6 text-light-text dark:text-dark-text" />
          <h1 class="text-xl font-semibold text-light-text dark:text-dark-text">
            EC2
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            :loading="loading"
            @click="loadAll"
          >
            <ArrowPathIcon class="h-4 w-4" />
          </Button>
          <Button
            v-if="activeTab === 'instances'"
            size="sm"
            @click="showCreateModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Run Instance
          </Button>
          <Button
            v-else-if="activeTab === 'key-pairs'"
            size="sm"
            @click="showKeyPairModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Manage Key Pairs
          </Button>
          <Button
            v-else-if="activeTab === 'security-groups'"
            size="sm"
            @click="showSecurityGroupModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Security Group
          </Button>
          <Button
            v-else-if="activeTab === 'vpc-list'"
            size="sm"
            @click="showVpcModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create VPC
          </Button>
          <Button
            v-else-if="activeTab === 'subnet-list'"
            size="sm"
            @click="showSubnetModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Subnet
          </Button>
          <Button
            v-else-if="activeTab === 'route-tables'"
            size="sm"
            @click="showRouteTableModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Route Table
          </Button>
          <Button
            v-else-if="activeTab === 'internet-gateways'"
            size="sm"
            @click="showIgwModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create IGW
          </Button>
          <Button
            v-else-if="activeTab === 'nat-gateways'"
            size="sm"
            @click="showNatGatewayModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create NAT Gateway
          </Button>
          <Button
            v-else-if="activeTab === 'network-acls'"
            size="sm"
            @click="showNaclModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Network ACL
          </Button>
          <Button
            v-else-if="activeTab === 'flow-logs'"
            size="sm"
            @click="showFlowLogModal = true"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Create Flow Log
          </Button>
          <Button
            v-else-if="activeTab === 'elastic-ips'"
            size="sm"
            @click="handleAllocateElasticIp"
          >
            <PlusIcon class="h-4 w-4 mr-1" />
            Allocate Elastic IP
          </Button>
        </div>
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
    <div class="flex-1 overflow-auto p-6 space-y-6">
      <!-- Instances Tab -->
      <template v-if="activeTab === 'instances'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ instanceCount }} instance{{ instanceCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="instances.length === 0 && !loading"
          icon="server"
          title="No EC2 Instances"
          description="Launch your first EC2 instance to get started"
          action-label="Run Instance"
          @action="showCreateModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="instance in paginatedInstances"
            :key="instance.InstanceId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleInstances(instance.InstanceId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  <ServerIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ instance.InstanceId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ instance.InstanceType }} | {{ instance.ImageId }}
                  </p>
                </div>
                <StatusBadge
                  :status="getStatus(instance.State?.Name)"
                  :label="instance.State?.Name || 'unknown'"
                />
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="instance.State?.Name === 'running'"
                  variant="ghost"
                  size="sm"
                  title="Stop"
                  @click.stop="handleStopInstance(instance.InstanceId)"
                >
                  <StopIcon class="h-4 w-4" />
                </Button>
                <Button
                  v-if="instance.State?.Name === 'stopped'"
                  variant="ghost"
                  size="sm"
                  title="Start"
                  @click.stop="handleStartInstance(instance.InstanceId)"
                >
                  <PlayIcon class="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Terminate"
                  @click.stop="openDeleteConfirm(instance, 'instance')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedInstances.has(instance.InstanceId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedInstances.has(instance.InstanceId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Instance ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.InstanceId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Image ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.ImageId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Instance Type</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.InstanceType }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.State?.Name || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.KeyName || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Launch Time</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ formatDate(instance.LaunchTime) }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Availability Zone</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ instance.Placement?.AvailabilityZone || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.VpcId || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subnet ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.SubnetId || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Public IP</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.PublicIpAddress || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Private IP</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ instance.PrivateIpAddress || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="instances.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="instancesPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div
              v-if="totalInstancePages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="instancePage === 1"
                @click="goToInstancePage(instancePage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ instancePage }} of {{ totalInstancePages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="instancePage === totalInstancePages"
                @click="goToInstancePage(instancePage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Key Pairs Tab -->
      <template v-else-if="activeTab === 'key-pairs'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ keyPairCount }} key pair{{ keyPairCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="keyPairs.length === 0 && !loading"
          icon="key"
          title="No Key Pairs"
          description="Create or import a key pair to get started"
          action-label="Manage Key Pairs"
          @action="showKeyPairModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="kp in paginatedKeyPairs"
            :key="kp.KeyName"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleKeyPairs(kp.KeyName)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <KeyIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ kp.KeyName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                    {{ kp.KeyFingerprint }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(kp, 'keypair')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedKeyPairs.has(kp.KeyName) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedKeyPairs.has(kp.KeyName)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ kp.KeyName }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Fingerprint</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono break-all">
                    {{ kp.KeyFingerprint }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Type</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ kp.KeyType || 'rsa' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Key Pair ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ kp.KeyPairId || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="keyPairs.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="keyPairsPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div
              v-if="totalKeyPairPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="keyPairPage === 1"
                @click="goToKeyPairPage(keyPairPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ keyPairPage }} of {{ totalKeyPairPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="keyPairPage === totalKeyPairPages"
                @click="goToKeyPairPage(keyPairPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Security Groups Tab -->
      <template v-else-if="activeTab === 'security-groups'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ sgCount }} security group{{ sgCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="securityGroups.length === 0 && !loading"
          icon="shield-check"
          title="No Security Groups"
          description="Create a security group to get started"
          action-label="Create Security Group"
          @action="showSecurityGroupModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="sg in paginatedSecurityGroups"
            :key="sg.GroupId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleSecurityGroups(sg.GroupId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <ShieldCheckIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text">
                    {{ sg.GroupName }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted font-mono">
                    {{ sg.GroupId }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(sg, 'secgroup')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedSecurityGroups.has(sg.GroupId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedSecurityGroups.has(sg.GroupId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Group ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ sg.GroupId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Group Name</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ sg.GroupName }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Description</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ sg.Description }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ sg.VpcId }}
                  </p>
                </div>
              </div>

              <div v-if="sg.IpPermissions && sg.IpPermissions.length > 0">
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Ingress Rules</label>
                <div class="overflow-x-auto">
                  <table class="w-full text-sm border-collapse">
                    <thead>
                      <tr class="border-b border-light-border dark:border-dark-border">
                        <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                          Protocol
                        </th>
                        <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                          Port Range
                        </th>
                        <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                          Source
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(rule, idx) in sg.IpPermissions"
                        :key="idx"
                        class="border-b border-light-border/50 dark:border-dark-border/50"
                      >
                        <td class="py-2 px-3 text-light-text dark:text-dark-text">
                          {{ rule.IpProtocol }}
                        </td>
                        <td class="py-2 px-3 text-light-text dark:text-dark-text">
                          {{ rule.FromPort }}{{ rule.ToPort !== rule.FromPort ? ` - ${rule.ToPort}` : '' }}
                        </td>
                        <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                          {{ rule.IpRanges?.[0]?.CidrIp || '-' }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else>
                <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-2">Ingress Rules</label>
                <p class="text-sm text-light-muted dark:text-dark-muted">
                  No ingress rules
                </p>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="securityGroups.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="sgPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>

            <div
              v-if="totalSgPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="sgPage === 1"
                @click="goToSgPage(sgPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ sgPage }} of {{ totalSgPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="sgPage === totalSgPages"
                @click="goToSgPage(sgPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- VPCs Tab -->
      <template v-else-if="activeTab === 'vpc-list'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ vpcCount }} VPC{{ vpcCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="vpcs.length === 0 && !loading"
          icon="squares-2x2"
          title="No VPCs"
          description="Create a VPC to get started"
          action-label="Create VPC"
          @action="showVpcModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="vpc in paginatedVpcs"
            :key="vpc.VpcId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleVpcs(vpc.VpcId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <Squares2X2Icon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ vpc.VpcId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ vpc.CidrBlock }} | {{ vpc.State }}
                  </p>
                </div>
                <StatusBadge
                  :status="getStatus(vpc.State)"
                  :label="vpc.State"
                />
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(vpc, 'vpc')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedVpcs.has(vpc.VpcId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedVpcs.has(vpc.VpcId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ vpc.VpcId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">CIDR Block</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ vpc.CidrBlock }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ vpc.State }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Default VPC</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ vpc.IsDefault ? 'Yes' : 'No' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="vpcs.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="vpcsPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalVpcPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="vpcPage === 1"
                @click="goToVpcPage(vpcPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ vpcPage }} of {{ totalVpcPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="vpcPage === totalVpcPages"
                @click="goToVpcPage(vpcPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Subnets Tab -->
      <template v-else-if="activeTab === 'subnet-list'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ subnetCount }} subnet{{ subnetCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="subnets.length === 0 && !loading"
          icon="rectangle-group"
          title="No Subnets"
          description="Create a subnet to get started"
          action-label="Create Subnet"
          @action="showSubnetModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="subnet in paginatedSubnets"
            :key="subnet.SubnetId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleSubnets(subnet.SubnetId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
                  <RectangleGroupIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ subnet.SubnetId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ subnet.CidrBlock }} | {{ subnet.AvailabilityZone }}
                  </p>
                </div>
                <StatusBadge
                  :status="getStatus(subnet.State)"
                  :label="subnet.State"
                />
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(subnet, 'subnet')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedSubnets.has(subnet.SubnetId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedSubnets.has(subnet.SubnetId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subnet ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ subnet.SubnetId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ subnet.VpcId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">CIDR Block</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ subnet.CidrBlock }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Availability Zone</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ subnet.AvailabilityZone }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ subnet.State }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="subnets.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="subnetsPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalSubnetPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="subnetPage === 1"
                @click="goToSubnetPage(subnetPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ subnetPage }} of {{ totalSubnetPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="subnetPage === totalSubnetPages"
                @click="goToSubnetPage(subnetPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Route Tables Tab -->
      <template v-else-if="activeTab === 'route-tables'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ rtCount }} route table{{ rtCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="routeTables.length === 0 && !loading"
          icon="table-cells"
          title="No Route Tables"
          description="Create a route table to get started"
          action-label="Create Route Table"
          @action="showRouteTableModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="rt in paginatedRouteTables"
            :key="rt.RouteTableId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleRouteTables(rt.RouteTableId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  <TableCellsIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ rt.RouteTableId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    VPC: {{ rt.VpcId }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Manage Routes"
                  @click.stop="openRouteTableDetail(rt)"
                >
                  <AdjustmentsHorizontalIcon class="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(rt, 'routetable')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedRouteTables.has(rt.RouteTableId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedRouteTables.has(rt.RouteTableId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Route Table ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ rt.RouteTableId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ rt.VpcId }}
                  </p>
                </div>
              </div>
              <div class="mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  @click="openRouteTableDetail(rt)"
                >
                  Manage Routes &amp; Associations
                </Button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="routeTables.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="rtPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalRtPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="rtPage === 1"
                @click="goToRtPage(rtPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ rtPage }} of {{ totalRtPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="rtPage === totalRtPages"
                @click="goToRtPage(rtPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Internet Gateways Tab -->
      <template v-else-if="activeTab === 'internet-gateways'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ igwCount }} internet gateway{{ igwCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="internetGateways.length === 0 && !loading"
          icon="globe-alt"
          title="No Internet Gateways"
          description="Create an internet gateway to get started"
          action-label="Create IGW"
          @action="showIgwModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="igw in paginatedIgws"
            :key="igw.InternetGatewayId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleInternetGateways(igw.InternetGatewayId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                  <GlobeAltIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ igw.InternetGatewayId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ igw.Attachments?.length ? `Attached to ${igw.Attachments[0].VpcId}` : 'Not attached' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(igw, 'igw')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedInternetGateways.has(igw.InternetGatewayId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedInternetGateways.has(igw.InternetGatewayId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Internet Gateway ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ igw.InternetGatewayId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Attachments</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ igw.Attachments?.length ? igw.Attachments.map(a => `${a.VpcId} (${a.State})`).join(', ') : 'None' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="internetGateways.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="igwPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalIgwPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="igwPage === 1"
                @click="goToIgwPage(igwPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ igwPage }} of {{ totalIgwPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="igwPage === totalIgwPages"
                @click="goToIgwPage(igwPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- NAT Gateways Tab -->
      <template v-else-if="activeTab === 'nat-gateways'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ natCount }} NAT gateway{{ natCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="natGateways.length === 0 && !loading"
          icon="arrow-right-circle"
          title="No NAT Gateways"
          description="Create a NAT gateway to get started"
          action-label="Create NAT Gateway"
          @action="showNatGatewayModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="nat in paginatedNatGateways"
            :key="nat.NatGatewayId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleNatGateways(nat.NatGatewayId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                  <ArrowRightCircleIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ nat.NatGatewayId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ nat.State }} | {{ nat.SubnetId }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(nat, 'natgw')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedNatGateways.has(nat.NatGatewayId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedNatGateways.has(nat.NatGatewayId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">NAT Gateway ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ nat.NatGatewayId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">State</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ nat.State }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Subnet ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ nat.SubnetId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Public IP</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ nat.NatGatewayAddresses?.[0]?.PublicIp || '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="natGateways.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="natPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalNatPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="natPage === 1"
                @click="goToNatPage(natPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ natPage }} of {{ totalNatPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="natPage === totalNatPages"
                @click="goToNatPage(natPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Network ACLs Tab -->
      <template v-else-if="activeTab === 'network-acls'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ naclCount }} network ACL{{ naclCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="networkAcls.length === 0 && !loading"
          icon="adjustments-horizontal"
          title="No Network ACLs"
          description="Create a network ACL to get started"
          action-label="Create Network ACL"
          @action="showNaclModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="nacl in paginatedNacls"
            :key="nacl.NetworkAclId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleNetworkAcls(nacl.NetworkAclId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                  <AdjustmentsHorizontalIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ nacl.NetworkAclId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ nacl.VpcId }} | {{ nacl.IsDefault ? 'Default' : 'Custom' }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  title="Manage Rules"
                  @click.stop="openNaclRuleDetail(nacl)"
                >
                  <TableCellsIcon class="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(nacl, 'nacl')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedNetworkAcls.has(nacl.NetworkAclId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedNetworkAcls.has(nacl.NetworkAclId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Network ACL ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ nacl.NetworkAclId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ nacl.VpcId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Default</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ nacl.IsDefault ? 'Yes' : 'No' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Rules</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ nacl.Entries?.length || 0 }} rules
                  </p>
                </div>
              </div>
              <div class="mt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  @click="openNaclRuleDetail(nacl)"
                >
                  Manage Rules
                </Button>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="networkAcls.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="naclPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalNaclPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="naclPage === 1"
                @click="goToNaclPage(naclPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ naclPage }} of {{ totalNaclPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="naclPage === totalNaclPages"
                @click="goToNaclPage(naclPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Flow Logs Tab -->
      <template v-else-if="activeTab === 'flow-logs'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ flowLogCount }} flow log{{ flowLogCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="flowLogs.length === 0 && !loading"
          icon="beaker"
          title="No Flow Logs"
          description="Create a flow log to get started"
          action-label="Create Flow Log"
          @action="showFlowLogModal = true"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="fl in paginatedFlowLogs"
            :key="fl.FlowLogId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleFlowLogs(fl.FlowLogId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                  <BeakerIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ fl.FlowLogId }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ fl.ResourceId }} | {{ fl.TrafficType }}
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(fl, 'flowlog')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedFlowLogs.has(fl.FlowLogId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedFlowLogs.has(fl.FlowLogId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Flow Log ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ fl.FlowLogId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Resource ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ fl.ResourceId }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Log Destination</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono text-xs break-all">
                    {{ fl.LogDestination }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Traffic Type</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ fl.TrafficType }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="flowLogs.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="flowLogPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalFlowLogPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="flowLogPage === 1"
                @click="goToFlowLogPage(flowLogPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ flowLogPage }} of {{ totalFlowLogPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="flowLogPage === totalFlowLogPages"
                @click="goToFlowLogPage(flowLogPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Elastic IPs Tab -->
      <template v-else-if="activeTab === 'elastic-ips'">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm text-light-muted dark:text-dark-muted">
            {{ eipCount }} elastic IP{{ eipCount !== 1 ? 's' : '' }}
          </span>
        </div>

        <EmptyState
          v-if="elasticIps.length === 0 && !loading"
          icon="bolt"
          title="No Elastic IPs"
          description="Allocate an Elastic IP address to get started"
          action-label="Allocate Elastic IP"
          @action="handleAllocateElasticIp"
        />

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="eip in paginatedElasticIps"
            :key="eip.AllocationId"
            class="rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface"
          >
            <div
              class="flex items-center justify-between p-4 cursor-pointer hover:bg-light-bg dark:hover:bg-dark-bg transition-all"
              @click="toggleElasticIps(eip.AllocationId)"
            >
              <div class="flex items-center gap-3">
                <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                  <BoltIcon class="h-5 w-5" />
                </div>
                <div>
                  <h3 class="font-medium text-light-text dark:text-dark-text font-mono">
                    {{ eip.PublicIp }}
                  </h3>
                  <p class="text-xs text-light-muted dark:text-dark-muted">
                    {{ eip.AllocationId }}
                  </p>
                </div>
                <StatusBadge
                  :status="getStatus(eip.Domain ? 'available' : '')"
                  :label="eip.Domain || 'unknown'"
                />
              </div>
              <div class="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  @click.stop="openDeleteConfirm(eip, 'eip')"
                >
                  <TrashIcon class="h-4 w-4 text-red-500" />
                </Button>
                <ChevronRightIcon
                  class="h-5 w-5 text-light-muted dark:text-dark-muted transition-transform"
                  :class="expandedElasticIps.has(eip.AllocationId) ? 'rotate-90' : ''"
                />
              </div>
            </div>
            <div
              v-if="expandedElasticIps.has(eip.AllocationId)"
              class="border-t border-light-border dark:border-dark-border p-4"
            >
              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Allocation ID</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ eip.AllocationId || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Public IP</label>
                  <p class="text-sm text-light-text dark:text-dark-text font-mono">
                    {{ eip.PublicIp || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Domain</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ eip.Domain || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Network Border Group</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ eip.NetworkBorderGroup || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Public IPv4 Pool</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ eip.PublicIpv4Pool || '-' }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Tags</label>
                  <p class="text-sm text-light-text dark:text-dark-text">
                    {{ eip.Tags?.length ? eip.Tags.map(t => `${t.Key}=${t.Value}`).join(', ') : '-' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div
            v-if="elasticIps.length > 0"
            class="flex flex-wrap items-center justify-between gap-4 py-4"
          >
            <div class="flex items-center gap-2">
              <span class="text-sm text-light-muted dark:text-dark-muted">Show:</span>
              <select
                v-model="eipsPerPage"
                class="text-sm border rounded px-2 py-1"
                :class="settingsStore.darkMode ? 'bg-dark-surface border-dark-border text-dark-text' : 'bg-white border-light-border text-light-text'"
              >
                <option
                  v-for="opt in perPageOptions"
                  :key="opt"
                  :value="opt"
                >
                  {{ opt }}
                </option>
              </select>
              <span class="text-sm text-light-muted dark:text-dark-muted">per page</span>
            </div>
            <div
              v-if="totalEipPages > 1"
              class="flex items-center gap-2"
            >
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="eipPage === 1"
                @click="goToEipPage(eipPage - 1)"
              >
                Previous
              </button>
              <span
                class="text-sm"
                :class="settingsStore.darkMode ? 'text-dark-muted' : 'text-light-muted'"
              >
                Page {{ eipPage }} of {{ totalEipPages }}
              </span>
              <button
                class="px-3 py-1 rounded border disabled:opacity-50"
                :class="settingsStore.darkMode ? 'border-dark-border text-dark-text' : 'border-light-border text-light-text'"
                :disabled="eipPage === totalEipPages"
                @click="goToEipPage(eipPage + 1)"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Code Examples -->
      <EC2CodeExamples :examples="codeExamples" />
    </div>

    <!-- Modals -->
    <EC2CreateInstanceModal
      v-model:open="showCreateModal"
      v-model:form="createForm"
      :creating="creating"
      :key-pairs="keyPairs"
      :security-groups="securityGroups"
      :vpc-list="vpcs"
      :subnet-list="subnets"
      @create="runInstance"
    />

    <EC2KeyPairModal
      v-model:open="showKeyPairModal"
      :creating="keyPairCreating"
      :new-key-material="newKeyMaterial"
      @create-key-pair="handleCreateKeyPair"
      @import-key-pair="handleImportKeyPair"
    />

    <EC2SecurityGroupModal
      v-model:open="showSecurityGroupModal"
      :creating="sgCreating"
      :vpc-list="vpcs"
      @create="handleCreateSecurityGroup"
    />

    <!-- VPC Modals -->
    <VPCCreateVpcModal
      v-model:open="showVpcModal"
      :creating="vpcCreating"
      @create="handleCreateVpc"
    />

    <VPCCreateSubnetModal
      v-model:open="showSubnetModal"
      :creating="subnetCreating"
      :vpc-list="vpcs"
      @create="handleCreateSubnet"
    />

    <VPCCreateRouteTableModal
      v-model:open="showRouteTableModal"
      :creating="routeTableCreating"
      :vpc-list="vpcs"
      @create="handleCreateRouteTable"
    />

    <VPCCreateIgwModal
      v-model:open="showIgwModal"
      :creating="igwCreating"
      :vpc-list="vpcs"
      @create="handleCreateIgw"
    />

    <VPCCreateNatGatewayModal
      v-model:open="showNatGatewayModal"
      :creating="natGatewayCreating"
      :subnet-list="subnets"
      @create="handleCreateNatGateway"
    />

    <VPCCreateNaclModal
      v-model:open="showNaclModal"
      :creating="naclCreating"
      :vpc-list="vpcs"
      @create="handleCreateNacl"
    />

    <VPCCreateFlowLogModal
      v-model:open="showFlowLogModal"
      :creating="flowLogCreating"
      :vpc-list="vpcs"
      @create="handleCreateFlowLog"
    />

    <VPCDeleteModal
      v-model:open="showDeleteConfirm"
      :item-name="itemToDelete?.InstanceId || itemToDelete?.KeyName || itemToDelete?.GroupId || itemToDelete?.VpcId || itemToDelete?.SubnetId || itemToDelete?.RouteTableId || itemToDelete?.InternetGatewayId || itemToDelete?.NatGatewayId || itemToDelete?.NetworkAclId || itemToDelete?.FlowLogId || itemToDelete?.AllocationId || ''"
      :item-type="deleteType"
      :deleting="deleting"
      @confirm="handleDelete"
    />

    <VPCRouteTableDetailModal
      v-model:open="showRouteTableDetailModal"
      :route-table="selectedRouteTable"
      :vpcs="vpcs"
      :subnets="subnets"
      :internet-gateways="internetGateways"
      :nat-gateways="natGateways"
      @add-route="handleCreateRoute"
      @delete-route="handleDeleteRoute"
      @associate="handleAssociateRouteTable"
      @disassociate="handleDisassociateRouteTable"
    />

    <VPCNaclRuleModal
      v-model:open="showNaclRuleModal"
      :nacl="selectedNacl"
      @add-rule="handleCreateNaclRule"
      @delete-rule="handleDeleteNaclRule"
    />
  </div>
</template>
