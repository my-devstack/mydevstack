import type { Meta, StoryObj } from '@storybook/vue3';
import StepFunctionsHistoryModal from './StepFunctionsHistoryModal.vue';

const meta: Meta<typeof StepFunctionsHistoryModal> = {
  title: 'Services/StepFunctions/HistoryModal',
  component: StepFunctionsHistoryModal,
  tags: ['autodocs'],
  argTypes: { open: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: {
    open: false,
    loading: false,
    events: [],
    columns: [
      { key: 'id', label: 'ID', sortable: true },
      { key: 'type', label: 'Type', sortable: true },
      { key: 'timestamp', label: 'Timestamp', sortable: true },
      { key: 'previousEventId', label: 'Previous Event', sortable: false },
    ],
    formatDate: (date: string | undefined) => date ? new Date(date).toLocaleString() : '-',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockEvents = [
  {
    id: '1',
    type: 'ExecutionStarted',
    timestamp: '2025-04-01T10:00:00Z',
    previousEventId: '0',
  },
  {
    id: '2',
    type: 'PassStateEntered',
    timestamp: '2025-04-01T10:00:01Z',
    previousEventId: '1',
  },
  {
    id: '3',
    type: 'PassStateExited',
    timestamp: '2025-04-01T10:00:02Z',
    previousEventId: '2',
  },
  {
    id: '4',
    type: 'ExecutionSucceeded',
    timestamp: '2025-04-01T10:00:03Z',
    previousEventId: '3',
  },
];

export const Default: Story = {
  args: { open: true, events: mockEvents },
  render: (args) => ({
    components: { StepFunctionsHistoryModal },
    setup: () => ({ args }),
    template: '<div class="h-96"><StepFunctionsHistoryModal v-bind="args" /></div>',
  }),
};

export const Loading: Story = {
  args: { open: true, loading: true, events: [] },
  render: (args) => ({
    components: { StepFunctionsHistoryModal },
    setup: () => ({ args }),
    template: '<div class="h-96"><StepFunctionsHistoryModal v-bind="args" /></div>',
  }),
};

export const Empty: Story = {
  args: { open: true, events: [] },
  render: (args) => ({
    components: { StepFunctionsHistoryModal },
    setup: () => ({ args }),
    template: '<div class="h-96"><StepFunctionsHistoryModal v-bind="args" /></div>',
  }),
};
