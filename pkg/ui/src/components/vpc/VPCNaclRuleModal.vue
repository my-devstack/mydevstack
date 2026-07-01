<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { TrashIcon } from '@heroicons/vue/24/outline'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import type { EC2NetworkAcl } from '@/api/types/aws'

const props = withDefaults(defineProps<{
  open: boolean
  nacl?: EC2NetworkAcl | null
}>(), {
  open: false,
  nacl: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'add-rule': [naclId: string, params: {
    RuleNumber: number
    Protocol: string
    PortRange?: { From: number; To: number }
    CidrBlock: string
    Egress: boolean
    RuleAction: 'allow' | 'deny'
  }]
  'delete-rule': [naclId: string, ruleNumber: number]
}>()

const activeTab = ref<'inbound' | 'outbound'>('inbound')

const ruleForm = reactive({
  RuleNumber: 100,
  Protocol: 'tcp',
  PortFrom: 80,
  PortTo: 80,
  CidrBlock: '0.0.0.0/0',
  Egress: false,
  RuleAction: 'allow' as 'allow' | 'deny',
})

const inboundEntries = computed(() =>
  props.nacl?.Entries?.filter((e) => !e.Egress) || [],
)

const outboundEntries = computed(() =>
  props.nacl?.Entries?.filter((e) => e.Egress) || [],
)

const protocolOptions = [
  { value: 'tcp', label: 'TCP' },
  { value: 'udp', label: 'UDP' },
  { value: 'icmp', label: 'ICMP' },
  { value: '-1', label: 'All' },
]

const ruleActionOptions = [
  { value: 'allow', label: 'Allow' },
  { value: 'deny', label: 'Deny' },
]

function handleClose() {
  emit('update:open', false)
}

function handleAddRule() {
  if (!props.nacl) return
  emit('add-rule', props.nacl.NetworkAclId, {
    RuleNumber: ruleForm.RuleNumber,
    Protocol: ruleForm.Protocol,
    PortRange: { From: ruleForm.PortFrom, To: ruleForm.PortTo },
    CidrBlock: ruleForm.CidrBlock,
    Egress: ruleForm.Egress,
    RuleAction: ruleForm.RuleAction,
  })
}

function handleDeleteRule(ruleNumber: number) {
  if (!props.nacl) return
  emit('delete-rule', props.nacl.NetworkAclId, ruleNumber)
}

function getProtocolLabel(protocol: string): string {
  const map: Record<string, string> = { tcp: 'TCP', udp: 'UDP', icmp: 'ICMP', '-1': 'All' }
  return map[protocol] || protocol
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="`Network ACL Rules: ${props.nacl?.NetworkAclId || ''}`"
    size="lg"
    @update:open="handleClose"
  >
    <template v-if="props.nacl">
      <div class="space-y-4">
        <!-- Tabs -->
        <div class="flex border-b border-light-border dark:border-dark-border">
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'inbound' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
            @click="activeTab = 'inbound'"
          >
            Inbound Rules
          </button>
          <button
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === 'outbound' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-light-muted dark:text-dark-muted hover:text-light-text dark:hover:text-dark-text'"
            @click="activeTab = 'outbound'"
          >
            Outbound Rules
          </button>
        </div>

        <!-- Rules Table -->
        <div
          v-if="(activeTab === 'inbound' ? inboundEntries : outboundEntries).length > 0"
          class="overflow-x-auto"
        >
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b border-light-border dark:border-dark-border">
                <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                  Rule #
                </th>
                <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                  Protocol
                </th>
                <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                  Port Range
                </th>
                <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                  CIDR
                </th>
                <th class="text-left py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase">
                  Action
                </th>
                <th class="text-right py-2 px-3 text-xs font-medium text-light-muted dark:text-dark-muted uppercase" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(entry, idx) in (activeTab === 'inbound' ? inboundEntries : outboundEntries)"
                :key="idx"
                class="border-b border-light-border/50 dark:border-dark-border/50"
              >
                <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                  {{ entry.RuleNumber }}
                </td>
                <td class="py-2 px-3 text-light-text dark:text-dark-text">
                  {{ getProtocolLabel(entry.Protocol) }}
                </td>
                <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                  {{ entry.PortRange ? `${entry.PortRange.From} - ${entry.PortRange.To}` : 'All' }}
                </td>
                <td class="py-2 px-3 text-light-text dark:text-dark-text font-mono">
                  {{ entry.CidrBlock }}
                </td>
                <td class="py-2 px-3">
                  <span
                    class="text-xs px-2 py-0.5 rounded-full"
                    :class="entry.RuleAction === 'allow' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
                  >
                    {{ entry.RuleAction }}
                  </span>
                </td>
                <td class="py-2 px-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    @click="handleDeleteRule(entry.RuleNumber)"
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
          class="text-sm text-light-muted dark:text-dark-muted"
        >
          No {{ activeTab === 'inbound' ? 'inbound' : 'outbound' }} rules
        </p>

        <!-- Add Rule Form -->
        <div class="border border-light-border dark:border-dark-border rounded-lg p-4 space-y-3">
          <p class="text-sm font-medium text-light-text dark:text-dark-text">
            Add Rule
          </p>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
            <FormInput
              v-model="ruleForm.RuleNumber"
              label="Rule Number"
              type="number"
              placeholder="100"
            />
            <FormSelect
              v-model="ruleForm.Protocol"
              label="Protocol"
              :options="protocolOptions"
            />
            <FormInput
              v-model="ruleForm.PortFrom"
              label="Port From"
              type="number"
              placeholder="80"
            />
            <FormInput
              v-model="ruleForm.PortTo"
              label="Port To"
              type="number"
              placeholder="80"
            />
            <FormInput
              v-model="ruleForm.CidrBlock"
              label="CIDR Block"
              placeholder="0.0.0.0/0"
            />
            <FormSelect
              v-model="ruleForm.RuleAction"
              label="Action"
              :options="ruleActionOptions"
            />
          </div>
          <div class="flex items-center gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input
                v-model="ruleForm.Egress"
                type="checkbox"
                class="rounded border-light-border"
              >
              Egress (outbound)
            </label>
          </div>
          <div class="flex justify-end">
            <Button
              size="sm"
              @click="handleAddRule"
            >
              Add Rule
            </Button>
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
