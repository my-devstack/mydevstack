import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { ECRModal } from './index'

vi.mock('@/stores/settings', () => ({
  useSettingsStore: vi.fn(() => ({
    darkMode: false,
  })),
}))

const stubs = {
  FormInput: {
    template: '<div><label v-if="label">{{ label }}</label><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /></div>',
    props: ['modelValue', 'label', 'placeholder', 'required'],
    emits: ['update:modelValue'],
  },
  Button: {
    template: '<button @click="$emit(\'click\')" :disabled="disabled" :loading="loading" :variant="variant"><slot /></button>',
    props: ['loading', 'variant', 'disabled'],
  },
}

const mockRepository = {
  RepositoryArn: 'arn:aws:ecr:us-east-1:000000000000:repository/my-app',
  RegistryId: '000000000000',
  RepositoryName: 'my-app',
  RepositoryUri: '000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app',
  CreatedAt: '2024-01-15T10:30:00Z',
  ImageTagMutability: 'MUTABLE',
  ImageScanningConfiguration: { ScanOnPush: true },
}

describe('ECRModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('does not render when open is false', () => {
    const wrapper = mount(ECRModal, {
      props: { open: false, mode: 'create', repository: null },
      global: { stubs },
    })
    expect(wrapper.html()).not.toContain('Create ECR Repository')
  })

  describe('create mode', () => {
    it('renders create form when open', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Create ECR Repository')
      expect(wrapper.html()).toContain('Repository Name')
    })

    it('emits create with form data when create clicked', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      wrapper.vm.form.repositoryName = 'my-app'
      wrapper.vm.form.imageTagMutability = 'IMMUTABLE'
      wrapper.vm.form.scanOnPush = true
      await wrapper.vm.handleConfirm()
      const emitted = wrapper.emitted('create')
      expect(emitted).toBeTruthy()
      if (emitted) {
        expect(emitted[0][0]).toEqual({
          repositoryName: 'my-app',
          imageTagMutability: 'IMMUTABLE',
          scanOnPush: true,
        })
      }
    })

    it('does not emit create when repositoryName is empty', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      wrapper.vm.form.repositoryName = ''
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('create')).toBeFalsy()
    })

    it('shows loading state when creating', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', loading: true, repository: null },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Creating...')
    })

    it('resets form when opened', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: false, mode: 'create', repository: null },
        global: { stubs },
      })
      wrapper.vm.form.repositoryName = 'dirty'
      await wrapper.setProps({ open: true })
      expect(wrapper.vm.form.repositoryName).toBe('')
    })
  })

  describe('view mode', () => {
    it('renders repository details', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'view', repository: mockRepository },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Repository Details')
      expect(wrapper.html()).toContain('my-app')
      expect(wrapper.html()).toContain('000000000000.dkr.ecr.us-east-1.amazonaws.com/my-app')
      expect(wrapper.html()).toContain('Enabled')
    })

    it('emits update:open false when close clicked', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'view', repository: mockRepository },
        global: { stubs },
      })
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('update:open')).toBeTruthy()
      if (wrapper.emitted('update:open')) {
        expect(wrapper.emitted('update:open')[0]).toEqual([false])
      }
    })
  })

  describe('delete mode', () => {
    it('renders delete confirmation', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'delete', repository: mockRepository },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Delete Repository')
      expect(wrapper.html()).toContain('permanently delete')
      expect(wrapper.html()).toContain('cannot be undone')
    })

    it('emits delete when delete clicked', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'delete', repository: mockRepository },
        global: { stubs },
      })
      await wrapper.vm.handleConfirm()
      expect(wrapper.emitted('delete')).toBeTruthy()
    })

    it('shows loading state when deleting', () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'delete', loading: true, repository: mockRepository },
        global: { stubs },
      })
      expect(wrapper.html()).toContain('Deleting...')
    })
  })

  describe('handleClose', () => {
    it('emits update:open false', async () => {
      const wrapper = mount(ECRModal, {
        props: { open: true, mode: 'create', repository: null },
        global: { stubs },
      })
      await wrapper.vm.handleClose()
      expect(wrapper.emitted('update:open')).toBeTruthy()
      if (wrapper.emitted('update:open')) {
        expect(wrapper.emitted('update:open')[0]).toEqual([false])
      }
    })
  })
})