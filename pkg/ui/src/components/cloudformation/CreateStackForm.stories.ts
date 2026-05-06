import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CreateStackForm from './CreateStackForm.vue';

const meta: Meta<typeof CreateStackForm> = {
  title: 'Services/CloudFormation/CreateStackForm',
  component: CreateStackForm,
  tags: ['autodocs'],
  argTypes: { loading: { control: 'boolean' } },
  args: { loading: false, open: true }
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" /></div>'
  })
};

export const Loading: Story = {
  args: { loading: true },
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" /></div>'
  })
};

export const JsonFormat: Story = {
  args: {},
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" @create="(params) => console.log(\'Created:\', params)" /></div>'
  }),
  play: async ({ canvas }) => {
    const textarea = canvas.locator('textarea')
    await textarea.fill('{"AWSTemplateFormatVersion": "2010-09-09", "Resources": {}}')
  }
};

export const YamlFormat: Story = {
  args: {},
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" /></div>'
  }),
  play: async ({ canvas }) => {
    const yamlButton = canvas.getByRole('button', { name: 'YAML' })
    await yamlButton.click()
  }
};

export const ValidationError: Story = {
  args: {},
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" /></div>'
  }),
  play: async ({ canvas }) => {
    const createButton = canvas.getByRole('button', { name: 'Create Stack' })
    await createButton.click()
  }
};

export const JsonValidationError: Story = {
  args: {},
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" /></div>'
  }),
  play: async ({ canvas }) => {
    const nameInput = canvas.getByPlaceholder('Enter stack name')
    await nameInput.fill('test-stack')
    const textarea = canvas.locator('textarea')
    await textarea.fill('invalid json')
    const createButton = canvas.getByRole('button', { name: 'Create Stack' })
    await createButton.click()
  }
};

export const YamlValidationError: Story = {
  args: {},
  render: (args) => ({
    components: { CreateStackForm },
    setup: () => ({ args }),
    template: '<div class="h-96"><CreateStackForm v-bind="args" /></div>'
  }),
  play: async ({ canvas }) => {
    const yamlButton = canvas.getByRole('button', { name: 'YAML' })
    await yamlButton.click()
    const nameInput = canvas.getByPlaceholder('Enter stack name')
    await nameInput.fill('test-stack')
    const textarea = canvas.locator('textarea')
    await textarea.fill('invalid: yaml: content:')
    const createButton = canvas.getByRole('button', { name: 'Create Stack' })
    await createButton.click()
  }
};