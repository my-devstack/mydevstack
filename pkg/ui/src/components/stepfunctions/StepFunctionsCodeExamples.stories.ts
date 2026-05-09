import type { Meta, StoryObj } from '@storybook/vue3-vite';
import StepFunctionsCodeExamples from './StepFunctionsCodeExamples.vue';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

const meta: Meta<typeof StepFunctionsCodeExamples> = {
  title: 'Services/StepFunctions/CodeExamples',
  component: StepFunctionsCodeExamples,
  tags: ['autodocs'],
  decorators: [(storyFn) => {
    setActivePinia(createPinia())
    const store = useSettingsStore()
    store.region = 'us-east-1'
    store.accessKey = 'AKIAIOSFODNN7EXAMPLE'
    store.secretKey = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    return storyFn()
  }],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  decorators: [(storyFn) => {
    setActivePinia(createPinia())
    const store = useSettingsStore()
    store.region = ''
    store.accessKey = ''
    store.secretKey = ''
    return storyFn()
  }],
};
