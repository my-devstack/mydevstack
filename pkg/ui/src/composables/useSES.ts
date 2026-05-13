import { ref } from 'vue'
import { useToast } from '@/composables/useToast'
import * as sesApi from '@/api/services/ses'
import type { SESIdentity, SESTemplate } from '@/api/types/aws'

export function useSES() {
  const toast = useToast()

  const identities = ref<SESIdentity[]>([])
  const templates = ref<SESTemplate[]>([])
  const loading = ref(false)
  const sending = ref(false)
  const expandedIdentities = ref<Set<string>>(new Set())
  const expandedTemplates = ref<Set<string>>(new Set())
  const selectedTab = ref<'identities' | 'templates'>('identities')

  // Lazy-loaded detail caches
  const templateDetails = ref<Record<string, any>>({})
  const loadingTemplateDetails = ref(false)
  const identityDetails = ref<Record<string, any>>({})
  const loadingIdentityDetails = ref(false)

  async function loadIdentities() {
    loading.value = true
    try {
      identities.value = await sesApi.listEmailIdentities()
    } catch (error) {
      toast.error('Failed to load SES identities')
    } finally {
      loading.value = false
    }
  }

  async function createIdentity(name: string, type: string = 'EMAIL_ADDRESS', tags?: { Key: string; Value: string }[]) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Identity name is required')
      return
    }
    await sesApi.createEmailIdentity(trimmedName, type, tags)
    toast.success('Identity created successfully')
    await loadIdentities()
  }

  async function deleteIdentity(name: string) {
    await sesApi.deleteEmailIdentity(name)
    toast.success('Identity deleted successfully')
    await loadIdentities()
  }

  async function sendEmail(
    from: string,
    to: string[],
    subject: string,
    body: string,
    options?: { HtmlBody?: string; Cc?: string[]; Bcc?: string[] }
  ): Promise<boolean> {
    if (!from.trim()) {
      toast.error('From email address is required')
      return false
    }
    if (!to.length || !to[0].trim()) {
      toast.error('At least one recipient is required')
      return false
    }
    if (!subject.trim()) {
      toast.error('Subject is required')
      return false
    }
    if (!body.trim()) {
      toast.error('Body is required')
      return false
    }
    sending.value = true
    try {
      await sesApi.sendEmail(from, to, subject, body, options)
      toast.success('Email sent successfully')
      return true
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to send email: ${msg}`)
      return false
    } finally {
      sending.value = false
    }
  }

  async function sendEmailWithTemplate(
    from: string,
    to: string[],
    templateName: string,
    templateData: string
  ): Promise<boolean> {
    if (!from.trim()) {
      toast.error('From email address is required')
      return false
    }
    if (!to.length || !to[0].trim()) {
      toast.error('At least one recipient is required')
      return false
    }
    if (!templateName.trim()) {
      toast.error('Template name is required')
      return false
    }
    sending.value = true
    try {
      let data: Record<string, string> = {}
      if (templateData.trim()) {
        try {
          data = JSON.parse(templateData)
        } catch {
          toast.error('Template data must be valid JSON')
          return false
        }
      }
      await sesApi.sendEmailWithTemplate(from, to, templateName, data)
      toast.success('Email sent successfully')
      return true
    } catch (error: any) {
      const msg = error?.message || error?.toString() || 'Unknown error'
      toast.error(`Failed to send email: ${msg}`)
      return false
    } finally {
      sending.value = false
    }
  }

  async function loadTemplates() {
    loading.value = true
    try {
      templates.value = await sesApi.listTemplates()
    } catch (error) {
      toast.error('Failed to load SES templates')
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(name: string, subject: string, htmlBody?: string, textBody?: string) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Template name is required')
      return
    }
    if (!subject.trim()) {
      toast.error('Template subject is required')
      return
    }
    await sesApi.createTemplate(trimmedName, subject, htmlBody, textBody)
    toast.success('Template created successfully')
    await loadTemplates()
  }

  async function deleteTemplate(name: string) {
    await sesApi.deleteTemplate(name)
    toast.success('Template deleted successfully')
    await loadTemplates()
  }

  async function updateTemplate(name: string, subject: string, htmlBody?: string, textBody?: string) {
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error('Template name is required')
      return
    }
    if (!subject.trim()) {
      toast.error('Template subject is required')
      return
    }
    await sesApi.updateTemplate(trimmedName, subject, htmlBody, textBody)
    toast.success('Template updated successfully')
    // Invalidate cached details so re-expand fetches fresh data
    delete templateDetails.value[trimmedName]
    await loadTemplates()
    // Re-fetch details if template is still expanded so UI shows fresh data
    if (expandedTemplates.value.has(trimmedName)) {
      await loadTemplateDetails(trimmedName)
    }
  }

  async function loadTemplateDetails(name: string) {
    loadingTemplateDetails.value = true
    try {
      const response = await sesApi.getTemplate(name)
      templateDetails.value = { ...templateDetails.value, [name]: response }
    } catch (error) {
      toast.error(`Failed to load template details for ${name}`)
    } finally {
      loadingTemplateDetails.value = false
    }
  }

  async function loadIdentityDetails(name: string) {
    loadingIdentityDetails.value = true
    try {
      const response = await sesApi.getEmailIdentity(name)
      identityDetails.value = { ...identityDetails.value, [name]: response }
    } catch (error) {
      toast.error(`Failed to load identity details for ${name}`)
    } finally {
      loadingIdentityDetails.value = false
    }
  }

  function toggleIdentity(identityName: string) {
    if (expandedIdentities.value.has(identityName)) {
      expandedIdentities.value.delete(identityName)
    } else {
      expandedIdentities.value.add(identityName)
      // Lazy-load full identity details on expand
      if (!identityDetails.value[identityName]) {
        loadIdentityDetails(identityName)
      }
    }
    expandedIdentities.value = new Set(expandedIdentities.value)
  }

  function toggleTemplate(templateName: string) {
    if (expandedTemplates.value.has(templateName)) {
      expandedTemplates.value.delete(templateName)
    } else {
      expandedTemplates.value.add(templateName)
      // Lazy-load full template details on expand
      if (!templateDetails.value[templateName]) {
        loadTemplateDetails(templateName)
      }
    }
    expandedTemplates.value = new Set(expandedTemplates.value)
  }

  function getVerificationStatus(status: string | undefined): 'active' | 'pending' | 'inactive' {
    if (!status) return 'inactive'
    const s = status.toUpperCase()
    if (s === 'SUCCESS' || s === 'VERIFIED') return 'active'
    if (s === 'PENDING' || s === 'IN_PROGRESS') return 'pending'
    return 'inactive'
  }

  function switchTab(tab: 'identities' | 'templates') {
    selectedTab.value = tab
    if (tab === 'identities' && identities.value.length === 0) {
      loadIdentities()
    }
    if (tab === 'templates' && templates.value.length === 0) {
      loadTemplates()
    }
  }

  return {
    identities,
    templates,
    loading,
    sending,
    expandedIdentities,
    expandedTemplates,
    selectedTab,
    templateDetails,
    loadingTemplateDetails,
    identityDetails,
    loadingIdentityDetails,
    loadIdentities,
    createIdentity,
    deleteIdentity,
    sendEmail,
    sendEmailWithTemplate,
    loadTemplates,
    createTemplate,
    deleteTemplate,
    updateTemplate,
    loadTemplateDetails,
    loadIdentityDetails,
    toggleIdentity,
    toggleTemplate,
    getVerificationStatus,
    switchTab,
  }
}
