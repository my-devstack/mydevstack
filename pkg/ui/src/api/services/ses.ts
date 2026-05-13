/**
 * SES Service API Client
 * Simple HTTP client for SESv2 via Go proxy
 * @module api/services/ses
 */

import { PROXY_BACKEND } from '@/config'
import { APIError } from '../client'

async function sesRequest(action: string, body: object = {}): Promise<any> {
  const endpoint = PROXY_BACKEND.replace(/\/$/, '')
  const url = `${endpoint}/sesv2/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Amz-Target': `sesv2.${action}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new APIError(`SES ${action} failed: ${errorText}`, response.status, 'ses')
    }

    return response.json()
  } catch (error) {
    if (error instanceof APIError) throw error
    console.error(`SES ${action} error:`, error)
    throw new APIError(`Failed to ${action}`, 500, 'ses')
  }
}

export class SESService {
  async listEmailIdentities(): Promise<any[]> {
    const response = await sesRequest('ListEmailIdentities', {})
    return response.EmailIdentities || []
  }

  async getEmailIdentity(name: string): Promise<any> {
    return sesRequest('GetEmailIdentity', { EmailIdentity: name })
  }

  async createEmailIdentity(name: string, type: string = 'EMAIL_ADDRESS', tags?: { Key: string; Value: string }[]): Promise<any> {
    const body: any = { EmailIdentity: name }
    if (tags?.length) {
      body.Tags = tags
    }
    return sesRequest('CreateEmailIdentity', body)
  }

  async deleteEmailIdentity(name: string): Promise<void> {
    return sesRequest('DeleteEmailIdentity', { EmailIdentity: name })
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
    return sesRequest('SendEmail', {
      FromEmailAddress: from,
      Destination: destination,
      Content: content,
    })
  }

  async listTemplates(): Promise<any[]> {
    const response = await sesRequest('ListEmailTemplates', {})
    return response.TemplatesMetadata || []
  }

  async getTemplate(name: string): Promise<any> {
    return sesRequest('GetEmailTemplate', { TemplateName: name })
  }

  async createTemplate(name: string, subject: string, htmlBody?: string, textBody?: string): Promise<any> {
    return sesRequest('CreateEmailTemplate', {
      TemplateName: name,
      TemplateContent: {
        Subject: subject,
        Html: htmlBody || '',
        Text: textBody || '',
      },
    })
  }

  async updateTemplate(name: string, subject: string, htmlBody?: string, textBody?: string): Promise<any> {
    return sesRequest('UpdateEmailTemplate', {
      TemplateName: name,
      TemplateContent: {
        Subject: subject,
        Html: htmlBody || '',
        Text: textBody || '',
      },
    })
  }

  async deleteTemplate(name: string): Promise<void> {
    return sesRequest('DeleteEmailTemplate', { TemplateName: name })
  }

  async sendEmailWithTemplate(
    from: string,
    to: string[],
    templateName: string,
    templateData: Record<string, string>
  ): Promise<any> {
    return sesRequest('SendEmail', {
      FromEmailAddress: from,
      Destination: { ToAddresses: to },
      Content: {
        Template: {
          TemplateName: templateName,
          TemplateData: JSON.stringify(templateData),
        },
      },
    })
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
