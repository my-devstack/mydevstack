import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSES } from './useSES'
import * as sesApi from '@/api/services/ses'

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/api/services/ses')

describe('useSES', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loadIdentities success', async () => {
    const mockIdentities = [
      { IdentityName: 'test@example.com', IdentityType: 'EMAIL_ADDRESS', SendingEnabled: true, VerifiedStatus: 'Success' },
    ]
    vi.mocked(sesApi.listEmailIdentities).mockResolvedValue(mockIdentities)

    const { identities, loading, loadIdentities } = useSES()
    expect(identities.value).toEqual([])

    await loadIdentities()

    expect(identities.value).toEqual(mockIdentities)
    expect(loading.value).toBe(false)
  })

  it('loadIdentities error', async () => {
    vi.mocked(sesApi.listEmailIdentities).mockRejectedValue(new Error('Network error'))

    const { identities, loadIdentities } = useSES()
    await loadIdentities()

    expect(identities.value).toEqual([])
  })

  it('createIdentity trims name', async () => {
    vi.mocked(sesApi.createEmailIdentity).mockResolvedValue({})
    vi.mocked(sesApi.listEmailIdentities).mockResolvedValue([])

    const { createIdentity } = useSES()
    await createIdentity('  test@example.com  ', 'EMAIL_ADDRESS')

    expect(sesApi.createEmailIdentity).toHaveBeenCalledWith('test@example.com', 'EMAIL_ADDRESS', undefined)
  })

  it('createIdentity requires name', async () => {
    const { createIdentity } = useSES()
    await createIdentity('', 'EMAIL_ADDRESS')

    expect(sesApi.createEmailIdentity).not.toHaveBeenCalled()
  })

  it('createIdentity passes tags to API', async () => {
    vi.mocked(sesApi.createEmailIdentity).mockResolvedValue({})
    vi.mocked(sesApi.listEmailIdentities).mockResolvedValue([])

    const tags = [{ Key: 'env', Value: 'test' }, { Key: 'owner', Value: 'team' }]
    const { createIdentity } = useSES()
    await createIdentity('test@example.com', 'EMAIL_ADDRESS', tags)

    expect(sesApi.createEmailIdentity).toHaveBeenCalledWith('test@example.com', 'EMAIL_ADDRESS', tags)
  })

  it('deleteIdentity calls API', async () => {
    vi.mocked(sesApi.deleteEmailIdentity).mockResolvedValue(undefined)
    vi.mocked(sesApi.listEmailIdentities).mockResolvedValue([])

    const { deleteIdentity } = useSES()
    await deleteIdentity('test@example.com')

    expect(sesApi.deleteEmailIdentity).toHaveBeenCalledWith('test@example.com')
  })

  it('sendEmail validates required fields and returns false', async () => {
    const { sendEmail } = useSES()

    const result1 = await sendEmail('', ['to@test.com'], 'Subject', 'Body')
    expect(sesApi.sendEmail).not.toHaveBeenCalled()
    expect(result1).toBe(false)

    const result2 = await sendEmail('from@test.com', [], 'Subject', 'Body')
    expect(sesApi.sendEmail).not.toHaveBeenCalled()
    expect(result2).toBe(false)

    const result3 = await sendEmail('from@test.com', ['to@test.com'], '', 'Body')
    expect(sesApi.sendEmail).not.toHaveBeenCalled()
    expect(result3).toBe(false)

    const result4 = await sendEmail('from@test.com', ['to@test.com'], 'Subject', '')
    expect(sesApi.sendEmail).not.toHaveBeenCalled()
    expect(result4).toBe(false)
  })

  it('sendEmail returns true on success', async () => {
    vi.mocked(sesApi.sendEmail).mockResolvedValue({ MessageId: 'test' })

    const { sendEmail } = useSES()
    const result = await sendEmail('from@test.com', ['to@test.com'], 'Subject', 'Body', { HtmlBody: '<p>Body</p>' })

    expect(sesApi.sendEmail).toHaveBeenCalledWith('from@test.com', ['to@test.com'], 'Subject', 'Body', { HtmlBody: '<p>Body</p>' })
    expect(result).toBe(true)
  })

  it('sendEmail returns false on API error', async () => {
    vi.mocked(sesApi.sendEmail).mockRejectedValue(new Error('API error'))

    const { sendEmail } = useSES()
    const result = await sendEmail('from@test.com', ['to@test.com'], 'Subject', 'Body')

    expect(sesApi.sendEmail).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('sendEmailWithTemplate validates required fields and returns false', async () => {
    const { sendEmailWithTemplate } = useSES()

    const result1 = await sendEmailWithTemplate('', ['to@test.com'], 'template', '{}')
    expect(sesApi.sendEmailWithTemplate).not.toHaveBeenCalled()
    expect(result1).toBe(false)

    const result2 = await sendEmailWithTemplate('from@test.com', [], 'template', '{}')
    expect(sesApi.sendEmailWithTemplate).not.toHaveBeenCalled()
    expect(result2).toBe(false)

    const result3 = await sendEmailWithTemplate('from@test.com', ['to@test.com'], '', '{}')
    expect(sesApi.sendEmailWithTemplate).not.toHaveBeenCalled()
    expect(result3).toBe(false)
  })

  it('sendEmailWithTemplate calls API with parsed JSON data and returns true', async () => {
    vi.mocked(sesApi.sendEmailWithTemplate).mockResolvedValue({ MessageId: 'test' })

    const { sendEmailWithTemplate } = useSES()
    const result = await sendEmailWithTemplate('from@test.com', ['to@test.com'], 'my-template', '{"name":"John"}')

    expect(sesApi.sendEmailWithTemplate).toHaveBeenCalledWith('from@test.com', ['to@test.com'], 'my-template', { name: 'John' })
    expect(result).toBe(true)
  })

  it('sendEmailWithTemplate handles invalid JSON error and returns false', async () => {
    const { sendEmailWithTemplate } = useSES()

    const result = await sendEmailWithTemplate('from@test.com', ['to@test.com'], 'my-template', 'not-valid-json')

    expect(sesApi.sendEmailWithTemplate).not.toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('sendEmailWithTemplate uses empty object for blank template data and returns true', async () => {
    vi.mocked(sesApi.sendEmailWithTemplate).mockResolvedValue({ MessageId: 'test' })

    const { sendEmailWithTemplate } = useSES()
    const result = await sendEmailWithTemplate('from@test.com', ['to@test.com'], 'my-template', '')

    expect(sesApi.sendEmailWithTemplate).toHaveBeenCalledWith('from@test.com', ['to@test.com'], 'my-template', {})
    expect(result).toBe(true)
  })

  it('sendEmailWithTemplate returns false on API error', async () => {
    vi.mocked(sesApi.sendEmailWithTemplate).mockRejectedValue(new Error('API error'))

    const { sendEmailWithTemplate } = useSES()
    const result = await sendEmailWithTemplate('from@test.com', ['to@test.com'], 'my-template', '{"name":"John"}')

    expect(sesApi.sendEmailWithTemplate).toHaveBeenCalled()
    expect(result).toBe(false)
  })

  it('toggleIdentity expands and collapses', async () => {
    const { expandedIdentities, toggleIdentity } = useSES()

    toggleIdentity('test@example.com')
    expect(expandedIdentities.value.has('test@example.com')).toBe(true)

    toggleIdentity('test@example.com')
    expect(expandedIdentities.value.has('test@example.com')).toBe(false)
  })

  it('loadTemplates success', async () => {
    const mockTemplates = [
      { TemplateName: 'my-template', TemplateContent: { Subject: 'Hello' } },
    ]
    vi.mocked(sesApi.listTemplates).mockResolvedValue(mockTemplates)

    const { templates, loadTemplates } = useSES()
    await loadTemplates()

    expect(templates.value).toEqual(mockTemplates)
  })

  it('loadTemplates error', async () => {
    vi.mocked(sesApi.listTemplates).mockRejectedValue(new Error('Network error'))

    const { templates, loadTemplates } = useSES()
    await loadTemplates()

    expect(templates.value).toEqual([])
  })

  it('createTemplate calls API', async () => {
    vi.mocked(sesApi.createTemplate).mockResolvedValue({})
    vi.mocked(sesApi.listTemplates).mockResolvedValue([])

    const { createTemplate } = useSES()
    await createTemplate('my-template', 'Hello', '<p>Body</p>', 'Text body')

    expect(sesApi.createTemplate).toHaveBeenCalledWith('my-template', 'Hello', '<p>Body</p>', 'Text body')
  })

  it('createTemplate requires name and subject', async () => {
    const { createTemplate } = useSES()

    await createTemplate('', 'Subject')
    expect(sesApi.createTemplate).not.toHaveBeenCalled()

    await createTemplate('name', '')
    expect(sesApi.createTemplate).not.toHaveBeenCalled()
  })

  it('deleteTemplate calls API', async () => {
    vi.mocked(sesApi.deleteTemplate).mockResolvedValue(undefined)
    vi.mocked(sesApi.listTemplates).mockResolvedValue([])

    const { deleteTemplate } = useSES()
    await deleteTemplate('my-template')

    expect(sesApi.deleteTemplate).toHaveBeenCalledWith('my-template')
  })

  it('toggleTemplate expands and collapses', async () => {
    const { expandedTemplates, toggleTemplate } = useSES()

    toggleTemplate('my-template')
    expect(expandedTemplates.value.has('my-template')).toBe(true)

    toggleTemplate('my-template')
    expect(expandedTemplates.value.has('my-template')).toBe(false)
  })

  it('loadTemplateDetails fetches and caches template detail', async () => {
    const detailResponse = {
      TemplateName: 'my-template',
      TemplateContent: { Subject: 'Hello', Html: '<p>Hi</p>', Text: 'Hi' },
    }
    vi.mocked(sesApi.getTemplate).mockResolvedValue(detailResponse)

    const { templateDetails, loadTemplateDetails } = useSES()
    await loadTemplateDetails('my-template')

    expect(sesApi.getTemplate).toHaveBeenCalledWith('my-template')
    expect(templateDetails.value['my-template']).toEqual(detailResponse)
  })

  it('loadTemplateDetails error does not throw', async () => {
    vi.mocked(sesApi.getTemplate).mockRejectedValue(new Error('API error'))

    const { templateDetails, loadTemplateDetails } = useSES()
    await loadTemplateDetails('my-template')

    expect(templateDetails.value['my-template']).toBeUndefined()
  })

  it('toggleTemplate lazy-loads details on expand', async () => {
    const detailResponse = { TemplateName: 'my-template', TemplateContent: { Subject: 'Hello' } }
    vi.mocked(sesApi.getTemplate).mockResolvedValue(detailResponse)

    const { templateDetails, expandedTemplates, toggleTemplate } = useSES()

    toggleTemplate('my-template')
    // Should trigger async load
    await new Promise(process.nextTick)

    expect(expandedTemplates.value.has('my-template')).toBe(true)
    expect(sesApi.getTemplate).toHaveBeenCalledWith('my-template')
    // After tick, the promise may not have resolved yet, but the call was made
  })

  it('loadIdentityDetails fetches and caches identity detail', async () => {
    const detailResponse = {
      IdentityName: 'test@example.com',
      IdentityType: 'EMAIL_ADDRESS',
      SendingEnabled: true,
      VerificationStatus: 'Success',
      Tags: [{ Key: 'env', Value: 'test' }],
    }
    vi.mocked(sesApi.getEmailIdentity).mockResolvedValue(detailResponse)

    const { identityDetails, loadIdentityDetails } = useSES()
    await loadIdentityDetails('test@example.com')

    expect(sesApi.getEmailIdentity).toHaveBeenCalledWith('test@example.com')
    expect(identityDetails.value['test@example.com']).toEqual(detailResponse)
  })

  it('loadIdentityDetails error does not throw', async () => {
    vi.mocked(sesApi.getEmailIdentity).mockRejectedValue(new Error('API error'))

    const { identityDetails, loadIdentityDetails } = useSES()
    await loadIdentityDetails('test@example.com')

    expect(identityDetails.value['test@example.com']).toBeUndefined()
  })

  it('toggleIdentity lazy-loads details on expand', async () => {
    const detailResponse = { IdentityName: 'test@example.com', VerificationStatus: 'Success' }
    vi.mocked(sesApi.getEmailIdentity).mockResolvedValue(detailResponse)

    const { identityDetails, expandedIdentities, toggleIdentity } = useSES()

    toggleIdentity('test@example.com')
    await new Promise(process.nextTick)

    expect(expandedIdentities.value.has('test@example.com')).toBe(true)
    expect(sesApi.getEmailIdentity).toHaveBeenCalledWith('test@example.com')
  })

  it('updateTemplate calls updateTemplate API and reloads', async () => {
    vi.mocked(sesApi.updateTemplate).mockResolvedValue({})
    vi.mocked(sesApi.listTemplates).mockResolvedValue([])

    const { updateTemplate } = useSES()
    await updateTemplate('my-template', 'New Subject', '<p>New</p>', 'New text')

    expect(sesApi.updateTemplate).toHaveBeenCalledWith('my-template', 'New Subject', '<p>New</p>', 'New text')
    expect(sesApi.listTemplates).toHaveBeenCalled()
  })

  it('updateTemplate requires name and subject', async () => {
    const { updateTemplate } = useSES()

    await updateTemplate('', 'Subject')
    expect(sesApi.updateTemplate).not.toHaveBeenCalled()

    await updateTemplate('name', '')
    expect(sesApi.updateTemplate).not.toHaveBeenCalled()
  })

  describe('getVerificationStatus', () => {
    it('returns active for SUCCESS', () => {
      const { getVerificationStatus } = useSES()
      expect(getVerificationStatus('SUCCESS')).toBe('active')
    })

    it('returns active for VERIFIED', () => {
      const { getVerificationStatus } = useSES()
      expect(getVerificationStatus('VERIFIED')).toBe('active')
    })

    it('returns pending for PENDING', () => {
      const { getVerificationStatus } = useSES()
      expect(getVerificationStatus('PENDING')).toBe('pending')
    })

    it('returns pending for IN_PROGRESS', () => {
      const { getVerificationStatus } = useSES()
      expect(getVerificationStatus('IN_PROGRESS')).toBe('pending')
    })

    it('returns inactive for unknown', () => {
      const { getVerificationStatus } = useSES()
      expect(getVerificationStatus('FAILED')).toBe('inactive')
    })

    it('returns inactive for undefined', () => {
      const { getVerificationStatus } = useSES()
      expect(getVerificationStatus(undefined)).toBe('inactive')
    })
  })
})
