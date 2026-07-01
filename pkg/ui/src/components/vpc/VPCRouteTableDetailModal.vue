<script setup lang="ts">
import { reactive, computed } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import type { EC2RouteTable, EC2Vpc, EC2Subnet, EC2InternetGateway, EC2NatGateway } from '@/api/types/aws'

const props = withDefaults(defineProps<{
  open: boolean
  routeTable?: EC2RouteTable | null
  vpcs?: EC2Vpc[]
  subnets?: EC2Subnet[]
  internetGateways?: EC2InternetGateway[]
  natGateways?: EC2NatGateway[]
}>(), {
  open: false,
  routeTable: null,
  vpcs: () => [],
  subnets: () => [],
  internetGateways: () => [],
  natGateways: () => [],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add-route': [rtbId: string, params: { DestinationCidrBlock: string; GatewayId?: string; NatGatewayId?: string }]
  'delete-route': [rtbId: string, cidr: string]
  'associate': [rtbId: string, subnetId: string]
  'disassociate': [associationId: string]
}>()

const routeForm = reactive({
  DestinationCidrBlock: '0.0.0.0/0',
  targetType: 'igw',
  TargetId: '',
})

const associationForm = reactive({
  SubnetId: '',
})

const igwOptions = computed(() =>
  props.internetGateways.map((igw) => ({ value: igw.InternetGatewayId, label: igw.InternetGatewayId })),
)

const natOptions = computed(() =>
  props.natGateways.map((nat) => ({ value: nat.NatGatewayId, label: nat.NatGatewayId })),
)

const subnetOptions = computed(() =>
  props.subnets.map((s) => ({ value: s.SubnetId, label: `${s.SubnetId} (${s.CidrBlock}, ${s.AvailabilityZone})` })),
)

function handleClose() {
  emit('update:open', false)
}

function handleAddRoute() {
  if (!props.routeTable) return
  const params: { DestinationCidrBlock: string; GatewayId?: string; NatGatewayId?: string } = {
    DestinationCidrBlock: routeForm.DestinationCidrBlock,
  }
  if (routeForm.targetType === 'igw') {
    params.GatewayId = routeForm.TargetId
  } else if (routeForm.targetType === 'nat') {
    params.NatGatewayId = routeForm.TargetId
  }
  emit('add-route', props.routeTable.RouteTableId, params)
}

function handleDeleteRoute(cidr: string) {
  if (!props.routeTable) return
  emit('delete-route', props.routeTable.RouteTableId, cidr)
}

function handleAssociate() {
  if (!props.routeTable) return
  emit('associate', props.routeTable.RouteTableId, associationForm.SubnetId)
}

function handleDisassociate(associationId: string) {
  emit('disassociate', associationId)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="`Route Table: ${routeTable?.RouteTableId || ''}`"
    size="lg"
    @update:open="handleClose"
  >
    <template v-if="routeTable">
      <div class="space-y-6">
        <!-- Basic Info -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">Route Table ID</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ routeTable.RouteTableId }}
            </p>
          </div>
          <div>
            <label class="block text-xs font-medium text-light-muted dark:text-dark-muted uppercase mb-1">VPC ID</label>
            <p class="text-sm text-light-text dark:text-dark-text font-mono">
              {{ routeTable.VpcId }}
            </p>
          </div>
        </div>

        <!-- Routes Section -->
        <div>
          <h3 class="text-sm font-semibold text-light-text dark:text-dark-text mb-2">
            Routes
          </h3>

          <div
            v-if="routeTable.Routes && routeTable.Routes.length > 0"
            class="overflow-x-auto mb-3"
          >
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-light-border dark:border-dark-border">
                  <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Destination
                  </th>
                  <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Target
                  </th>
                  <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    State
                  </th>
                  <th class="text-right py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(route, idx) in routeTable.Routes"
                  :key="idx"
                  class="border-b border-light-border/50 dark:border-dark-border/50"
                >
                  <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                    {{ route.DestinationCidrBlock || '-' }}
                  </td>
                  <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                    {{ route.GatewayId || route.NatGatewayId || 'local' }}
                  </td>
                  <td class="py-2 px-3">
                    <span
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="route.State === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'"
                    >
                      {{ route.State }}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-right">
                    <Button
                      v-if="route.DestinationCidrBlock !== '0.0.0.0/0' && route.GatewayId !== 'local'"
                      variant="ghost"
                      size="sm"
                      @click="handleDeleteRoute(route.DestinationCidrBlock || '')"
                    >
                      <TrashIcon class="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-else
            class="text-sm text-light-muted dark:text-dark-muted mb-3"
          >
            No routes
          </p>

          <!-- Add Route Form -->
          <div class="border border-light-border dark:border-dark-border rounded-lg p-3 space-y-3">
            <p class="text-sm font-medium text-light-text dark:text-dark-text">
              Add Route
            </p>
            <div class="grid grid-cols-3 gap-3">
              <FormInput
                v-model="routeForm.DestinationCidrBlock"
                label="Destination CIDR"
                placeholder="0.0.0.0/0"
              />
              <FormSelect
                v-model="routeForm.targetType"
                label="Target Type"
                :options="[
                  { value: 'igw', label: 'Internet Gateway' },
                  { value: 'nat', label: 'NAT Gateway' },
                ]"
              />
              <FormSelect
                v-model="routeForm.TargetId"
                label="Target ID"
                :options="routeForm.targetType === 'igw' ? igwOptions : natOptions"
              />
            </div>
            <div class="flex justify-end">
              <Button
                size="sm"
                @click="handleAddRoute"
              >
                Add Route
              </Button>
            </div>
          </div>
        </div>

        <!-- Subnet Associations -->
        <div>
          <h3 class="text-sm font-semibold text-light-text dark:text-dark-text mb-2">
            Subnet Associations
          </h3>

          <div
            v-if="routeTable.Associations && routeTable.Associations.length > 0"
            class="overflow-x-auto mb-3"
          >
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-light-border dark:border-dark-border">
                  <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Association ID
                  </th>
                  <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Subnet ID
                  </th>
                  <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Main
                  </th>
                  <th class="text-right py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(assoc, idx) in routeTable.Associations"
                  :key="idx"
                  class="border-b border-light-border/50 dark:border-dark-border/50"
                >
                  <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono text-xs">
                    {{ assoc.RouteTableAssociationId }}
                  </td>
                  <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                    {{ assoc.SubnetId || '-' }}
                  </td>
                  <td class="py-2 px-3">
                    <span
                      v-if="assoc.Main"
                      class="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                    >Main</span>
                    <span
                      v-else
                      class="text-xs text-light-muted dark:text-dark-muted"
                    >No</span>
                  </td>
                  <td class="py-2 px-3 text-right">
                    <Button
                      v-if="!assoc.Main"
                      variant="ghost"
                      size="sm"
                      @click="handleDisassociate(assoc.RouteTableAssociationId)"
                    >
                      <TrashIcon class="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p
            v-else
            class="text-sm text-light-muted dark:text-dark-muted mb-3"
          >
            No associations
          </p>

          <!-- Associate Subnet Form -->
          <div class="border border-light-border dark:border-dark-border rounded-lg p-3 space-y-3">
            <p class="text-sm font-medium text-light-text dark:text-dark-text">
              Associate Subnet
            </p>
            <div class="grid grid-cols-2 gap-3">
              <FormSelect
                v-model="associationForm.SubnetId"
                label="Subnet"
                :options="subnetOptions"
              />
            </div>
            <div class="flex justify-end">
              <Button
                size="sm"
                @click="handleAssociate"
              >
                Associate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Close
        </Button>
      </div>
    </template>
  </Modal>
</template>
