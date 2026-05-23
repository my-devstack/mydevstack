import type { Meta, StoryObj } from '@storybook/vue3';
import StatusBadge from './StatusBadge.vue';

const meta: Meta<typeof StatusBadge> = {
  title: 'UI/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['active', 'inactive', 'pending', 'error', 'warning', 'success', 'aws_proxy', 'aws', 'lambda', 'http']
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    label: { control: 'text' },
    showDot: { control: 'boolean' },
    pulse: { control: 'boolean' }
  },
  args: {
    status: 'active',
    size: 'md',
    showDot: true,
    pulse: true
  }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: {
    status: 'active'
  }
};

export const Inactive: Story = {
  args: {
    status: 'inactive'
  }
};

export const Pending: Story = {
  args: {
    status: 'pending'
  }
};

export const Error: Story = {
  args: {
    status: 'error'
  }
};

export const Warning: Story = {
  args: {
    status: 'warning'
  }
};

export const Success: Story = {
  args: {
    status: 'success'
  }
};

export const Small: Story = {
  args: {
    status: 'active',
    size: 'sm'
  }
};

export const Large: Story = {
  args: {
    status: 'active',
    size: 'lg'
  }
};

export const NoDot: Story = {
  args: {
    status: 'active',
    showDot: false
  }
};

export const NoPulse: Story = {
  args: {
    status: 'pending',
    pulse: false
  }
};

export const CustomLabel: Story = {
  args: {
    status: 'active',
    label: 'Running'
  }
};

export const Lambda: Story = {
  args: {
    status: 'lambda'
  }
};

export const Http: Story = {
  args: {
    status: 'http'
  }
};

export const Aws: Story = {
  args: {
    status: 'aws'
  }
};

export const AwsProxy: Story = {
  args: {
    status: 'aws_proxy'
  }
};