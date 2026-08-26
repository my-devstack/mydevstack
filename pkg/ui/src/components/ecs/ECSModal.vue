<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import Modal from '@/components/common/Modal.vue'
import Button from '@/components/common/Button.vue'
import FormInput from '@/components/common/FormInput.vue'

export type ECSEntityType = 'cluster' | 'task-definition' | 'task' | 'service'

const props = defineProps<{
  open: boolean
  entity: ECSEntityType
  loading?: boolean
  clusters?: string[]
  taskDefinitions?: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [data: Record<string, any>]
}>()

const form = ref<Record<string, any>>({
  clusterName: '',
  family: '',
  containerName: '',
  image: '',
  cpu: '',
  memory: '',
  taskDefinition: '',
  count: '',
  launchType: 'FARGATE',
  serviceName: '',
  desiredCount: '',
})

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.value = {
        clusterName: '',
        family: '',
        containerName: '',
        image: '',
        cpu: '',
        memory: '',
        taskDefinition: '',
        count: '',
        launchType: 'FARGATE',
        serviceName: '',
        desiredCount: '',
      }
    }
  }
)

const titles: Record<ECSEntityType, string> = {
  cluster: 'Create Cluster',
  'task-definition': 'Register Task Definition',
  task: 'Run Task',
  service: 'Create Service',
}

const title = computed(() => titles[props.entity])

function handleSubmit() {
  const data: Record<string, any> = {}
  switch (props.entity) {
    case 'cluster':
      data.ClusterName = form.value.clusterName
      break
    case 'task-definition':
      data.Family = form.value.family
      data.ContainerDefinitions = [
        {
          Name: form.value.containerName,
          Image: form.value.image,
          Cpu: form.value.cpu ? Number(form.value.cpu) : undefined,
          Memory: form.value.memory ? Number(form.value.memory) : undefined,
          Essential: true,
        },
      ]
      break
    case 'task':
      data.Cluster = form.value.clusterName || undefined
      data.TaskDefinition = form.value.taskDefinition
      data.Count = form.value.count ? Number(form.value.count) : undefined
      data.LaunchType = form.value.launchType || undefined
      break
    case 'service':
      data.Cluster = form.value.clusterName || undefined
      data.ServiceName = form.value.serviceName
      data.TaskDefinition = form.value.taskDefinition
      data.DesiredCount = form.value.desiredCount ? Number(form.value.desiredCount) : undefined
      data.LaunchType = form.value.launchType || undefined
      break
  }
  emit('submit', data)
}

function handleClose() {
  emit('update:open', false)
}
</script>

<template>
  <Modal
    :open="props.open"
    :title="title"
    size="md"
    @update:open="handleClose"
  >
    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <!-- Cluster -->
      <template v-if="entity === 'cluster'">
        <FormInput
          v-model="form.clusterName"
          label="Cluster Name"
          placeholder="my-cluster"
          help-text="Name of the ECS cluster to create"
          required
        />
      </template>

      <!-- Task Definition -->
      <template v-else-if="entity === 'task-definition'">
        <FormInput
          v-model="form.family"
          label="Family"
          placeholder="my-task"
          help-text="Family name for the task definition"
          required
        />
        <FormInput
          v-model="form.containerName"
          label="Container Name"
          placeholder="web"
          required
        />
        <FormInput
          v-model="form.image"
          label="Image"
          placeholder="nginx:latest"
          required
        />
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model="form.cpu"
            label="CPU (units)"
            type="number"
            placeholder="256"
          />
          <FormInput
            v-model="form.memory"
            label="Memory (MB)"
            type="number"
            placeholder="512"
          />
        </div>
      </template>

      <!-- Task (Run) -->
      <template v-else-if="entity === 'task'">
        <FormInput
          v-model="form.clusterName"
          label="Cluster"
          placeholder="my-cluster"
          help-text="Cluster to run the task in"
        />
        <FormInput
          v-model="form.taskDefinition"
          label="Task Definition"
          placeholder="my-task:1"
          help-text="Task definition family:revision or ARN"
          required
        />
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model="form.count"
            label="Count"
            type="number"
            placeholder="1"
          />
          <FormInput
            v-model="form.launchType"
            label="Launch Type"
            placeholder="FARGATE"
          />
        </div>
      </template>

      <!-- Service -->
      <template v-else-if="entity === 'service'">
        <FormInput
          v-model="form.clusterName"
          label="Cluster"
          placeholder="my-cluster"
          help-text="Cluster to create the service in"
        />
        <FormInput
          v-model="form.serviceName"
          label="Service Name"
          placeholder="my-svc"
          required
        />
        <FormInput
          v-model="form.taskDefinition"
          label="Task Definition"
          placeholder="my-task:1"
          help-text="Task definition family:revision or ARN"
          required
        />
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            v-model="form.desiredCount"
            label="Desired Count"
            type="number"
            placeholder="1"
          />
          <FormInput
            v-model="form.launchType"
            label="Launch Type"
            placeholder="FARGATE"
          />
        </div>
      </template>
    </form>
    <template #footer>
      <Button
        variant="secondary"
        @click="handleClose"
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ entity === 'task-definition' ? 'Register' : entity === 'task' ? 'Run' : 'Create' }}
      </Button>
    </template>
  </Modal>
</template>