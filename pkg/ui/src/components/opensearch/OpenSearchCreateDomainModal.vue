<script setup lang="ts">
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'
import FormSelect from '@/components/common/FormSelect.vue'
import VpcSelector from '@/components/vpc/VpcSelector.vue'
import type { CreateDomainInput } from '@/api/services/opensearch'
import type { VpcSelection } from '@/types/vpc'

const props = withDefaults(defineProps<{
  open: boolean
  creating?: boolean
}>(), {
  creating: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'create': []
}>()

const form = defineModel<CreateDomainInput>('form', { default: {
  DomainName: '',
  EngineVersion: 'OpenSearch_2.13',
  ClusterConfig: {
    InstanceType: 't3.medium.search',
    InstanceCount: 1,
    DedicatedMasterEnabled: false,
    ZoneAwarenessEnabled: false,
  },
  EBSOptions: {
    EBSEnabled: true,
    VolumeType: 'gp2',
    VolumeSize: 10,
  },
}})

const vpcSelectionModel = defineModel<VpcSelection | null>('vpcSelection', { default: null })

const engineOptions = [
  { value: 'OpenSearch_2.3', label: 'OpenSearch 2.3' },
  { value: 'OpenSearch_2.5', label: 'OpenSearch 2.5' },
  { value: 'OpenSearch_2.7', label: 'OpenSearch 2.7' },
  { value: 'OpenSearch_2.9', label: 'OpenSearch 2.9' },
  { value: 'OpenSearch_2.11', label: 'OpenSearch 2.11' },
  { value: 'OpenSearch_2.13', label: 'OpenSearch 2.13' },
  { value: 'OpenSearch_2.15', label: 'OpenSearch 2.15' },
]

const instanceTypeOptions = [
  { value: 't3.medium.search', label: 't3.medium.search' },
  { value: 't3.large.search', label: 't3.large.search' },
  { value: 'm5.large.search', label: 'm5.large.search' },
  { value: 'm5.xlarge.search', label: 'm5.xlarge.search' },
]

function addTag() {
  if (!form.value.TagList) form.value.TagList = []
  form.value.TagList.push({ Key: '', Value: '' })
}

function removeTag(index: number) {
  if (form.value.TagList) {
    form.value.TagList.splice(index, 1)
  }
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    title="Create Domain"
    size="md"
    @update:open="handleClose"
  >
    <div class="space-y-4">
      <FormInput
        v-model="form.DomainName"
        label="Domain Name"
        placeholder="my-domain"
        required
      />

      <FormSelect
        v-model="form.EngineVersion"
        label="Engine Version"
        :options="engineOptions"
      />

      <FormSelect
        v-model="form.ClusterConfig.InstanceType"
        label="Instance Type"
        :options="instanceTypeOptions"
      />

      <FormInput
        v-model="form.ClusterConfig.InstanceCount"
        label="Instance Count"
        type="number"
        placeholder="1"
      />

      <FormInput
        v-model="form.EBSOptions.VolumeSize"
        label="EBS Volume Size (GB)"
        type="number"
        placeholder="10"
      />

      <!-- Tags Section -->
      <div>
        <label class="block text-sm font-medium text-light-text dark:text-dark-text mb-2">Tags</label>
        <div class="space-y-2">
          <div
            v-for="(tag, index) in (form.TagList || [])"
            :key="index"
            class="flex items-center gap-2"
          >
            <FormInput
              v-model="tag.Key"
              placeholder="Key"
              class="flex-1"
            />
            <FormInput
              v-model="tag.Value"
              placeholder="Value"
              class="flex-1"
            />
            <button
              type="button"
              class="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded flex-shrink-0"
              title="Remove tag"
              @click="removeTag(index)"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
        <button
          type="button"
          class="mt-2 text-sm text-primary-500 hover:text-primary-700 flex items-center gap-1"
          @click="addTag"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Tag
        </button>
      </div>

      <!-- VPC Configuration Section -->
      <details class="group border border-light-border dark:border-dark-border rounded-lg">
        <summary class="flex items-center justify-between px-4 py-3 cursor-pointer text-sm font-medium text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover rounded-lg transition-colors">
          <span>VPC Configuration <span class="text-light-muted dark:text-dark-muted font-normal">(optional)</span></span>
          <svg
            class="w-4 h-4 text-light-muted dark:text-dark-muted group-open:rotate-180 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </summary>
        <div class="px-4 pb-4">
          <VpcSelector
            v-model="vpcSelectionModel"
            resource-type="opensearch"
            :required="false"
            show-subnet
            show-security-group
          />
        </div>
      </details>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          variant="secondary"
          @click="handleClose"
        >
          Cancel
        </Button>
        <Button
          :loading="props.creating"
          @click="emit('create')"
        >
          Create
        </Button>
      </div>
    </template>
  </Modal>
</template>
