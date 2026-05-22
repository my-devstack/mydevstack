/**
 * SES Service API Client
 * REST HTTP client for SESv2 via Go proxy
 * @module api/services/ses
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

const api = PROXY_BACKEND.replace(/\/$/, '')

export class SESService {
  async listEmailIdentities(): Promise<any[]> {
    const res = await fetch(`${api}/sesv2/email-identities`)
    if (!res.ok) throw new APIError(`List email identities failed`, res.status, 'ses')
    const data = await res.json()
    return data.EmailIdentities || []
  }

  async getEmailIdentity(name: string): Promise<any> {
    const res = await fetch(`${api}/sesv2/email-identities/${encodeURIComponent(name)}`)
    if (!res.ok) throw new APIError(`Get email identity failed`, res.status, 'ses')
    return res.json()
  }

  async createEmailIdentity(name: string, type: string = 'EMAIL_ADDRESS', tags?: { Key: string; Value: string }[]): Promise<any> {
    const body: any = { EmailIdentity: name }
    if (tags?.length) {
      body.Tags = tags
    }
    const res = await fetch(`${api}/sesv2/email-identities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new APIError(`Create email identity failed`, res.status, 'ses')
    return res.json()
  }

  async deleteEmailIdentity(name: string): Promise<void> {
    const res = await fetch(`${api}/sesv2/email-identities/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (!res.ok) throw new APIError(`Delete email identity failed`, res.status, 'ses')
  }

  async sendEmail(
    from: string,
    to: string[],
    subject: string,
    body: string,
    options?: { HtmlBody?: string; Cc?: string[]; Bcc?: string[] }
  ): Promise<any> {
    const content: any = {
      Simple: {
        Subject: { Data: subject },
        Body: { Text: { Data: body } },
      },
    }
    if (options?.HtmlBody) {
      content.Simple.Body.Html = { Data: options.HtmlBody }
    }
    const destination: any = { ToAddresses: to }
    if (options?.Cc?.length) destination.CcAddresses = options.Cc
    if (options?.Bcc?.length) destination.BccAddresses = options.Bcc
    const res = await fetch(`${api}/sesv2/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FromEmailAddress: from,
        Destination: destination,
        Content: content,
      }),
    })
    if (!res.ok) throw new APIError(`Send email failed`, res.status, 'ses')
    return res.json()
  }

  async listTemplates(): Promise<any[]> {
    const res = await fetch(`${api}/sesv2/email-templates`)
    if (!res.ok) throw new APIError(`List email templates failed`, res.status, 'ses')
    const data = await res.json()
    return data.TemplatesMetadata || []
  }

  async getTemplate(name: string): Promise<any> {
    const res = await fetch(`${api}/sesv2/email-templates/${encodeURIComponent(name)}`)
    if (!res.ok) throw new APIError(`Get email template failed`, res.status, 'ses')
    return res.json()
  }

  async createTemplate(name: string, subject: string, htmlBody?: string, textBody?: string): Promise<any> {
    const res = await fetch(`${api}/sesv2/email-templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        TemplateName: name,
        TemplateContent: {
          Subject: subject,
          Html: htmlBody || '',
          Text: textBody || '',
        },
      }),
    })
    if (!res.ok) throw new APIError(`Create email template failed`, res.status, 'ses')
    return res.json()
  }

  async updateTemplate(name: string, subject: string, htmlBody?: string, textBody?: string): Promise<any> {
    const res = await fetch(`${api}/sesv2/email-templates/${encodeURIComponent(name)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        TemplateContent: {
          Subject: subject,
          Html: htmlBody || '',
          Text: textBody || '',
        },
      }),
    })
    if (!res.ok) throw new APIError(`Update email template failed`, res.status, 'ses')
    return res.json()
  }

  async deleteTemplate(name: string): Promise<void> {
    const res = await fetch(`${api}/sesv2/email-templates/${encodeURIComponent(name)}`, { method: 'DELETE' })
    if (!res.ok) throw new APIError(`Delete email template failed`, res.status, 'ses')
  }

  async sendEmailWithTemplate(
    from: string,
    to: string[],
    templateName: string,
    templateData: Record<string, string>
  ): Promise<any> {
    const res = await fetch(`${api}/sesv2/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        FromEmailAddress: from,
        Destination: { ToAddresses: to },
        Content: {
          Template: {
            TemplateName: templateName,
            TemplateData: JSON.stringify(templateData),
          },
        },
      }),
    })
    if (!res.ok) throw new APIError(`Send email failed`, res.status, 'ses')
    return res.json()
  }
}

export const sesService = new SESService()

export const listEmailIdentities = () => sesService.listEmailIdentities()
export const getEmailIdentity = (name: string) => sesService.getEmailIdentity(name)
export const createEmailIdentity = (name: string, type?: string, tags?: { Key: string; Value: string }[]) => sesService.createEmailIdentity(name, type, tags)
export const deleteEmailIdentity = (name: string) => sesService.deleteEmailIdentity(name)
export const sendEmail = (from: string, to: string[], subject: string, body: string, options?: { HtmlBody?: string; Cc?: string[]; Bcc?: string[] }) => sesService.sendEmail(from, to, subject, body, options)
export const listTemplates = () => sesService.listTemplates()
export const getTemplate = (name: string) => sesService.getTemplate(name)
export const createTemplate = (name: string, subject: string, htmlBody?: string, textBody?: string) => sesService.createTemplate(name, subject, htmlBody, textBody)
export const updateTemplate = (name: string, subject: string, htmlBody?: string, textBody?: string) => sesService.updateTemplate(name, subject, htmlBody, textBody)
export const deleteTemplate = (name: string) => sesService.deleteTemplate(name)
export const sendEmailWithTemplate = (from: string, to: string[], templateName: string, templateData: Record<string, string>) => sesService.sendEmailWithTemplate(from, to, templateName, templateData)

export default sesService
