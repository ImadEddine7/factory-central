import { ConfidentialClientApplication, type AuthorizationCodeRequest, type AuthorizationUrlRequest } from '@azure/msal-node'
import { Client } from '@microsoft/microsoft-graph-client'
import { prisma } from '../lib/prisma.js'

const TENANT_ID = process.env.MS_TENANT_ID || ''
const CLIENT_ID = process.env.MS_CLIENT_ID || ''
const CLIENT_SECRET = process.env.MS_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.MS_REDIRECT_URI || 'http://localhost:3001/api/microsoft/callback'

const SCOPES = [
  'Mail.Read',
  'Chat.Read',
  'ChannelMessage.Read.All',
  'Sites.Read.All',
  'User.Read',
  'offline_access',
]

let msalClient: ConfidentialClientApplication | null = null

function getMsalClient(): ConfidentialClientApplication {
  if (!msalClient) {
    msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${TENANT_ID}`,
      },
    })
  }
  return msalClient
}

export function isConfigured(): boolean {
  return !!(TENANT_ID && CLIENT_ID && CLIENT_SECRET)
}

export async function getAuthUrl(): Promise<string> {
  const client = getMsalClient()
  const request: AuthorizationUrlRequest = {
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
  }
  return await client.getAuthCodeUrl(request)
}

export async function handleCallback(code: string): Promise<void> {
  const client = getMsalClient()
  const request: AuthorizationCodeRequest = {
    code,
    scopes: SCOPES,
    redirectUri: REDIRECT_URI,
  }
  const response = await client.acquireTokenByCode(request)

  await prisma.microsoftToken.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      accessToken: response.accessToken,
      refreshToken: (response as any).refreshToken || '',
      expiresAt: response.expiresOn || new Date(Date.now() + 3600_000),
      account: response.account?.username || null,
    },
    update: {
      accessToken: response.accessToken,
      refreshToken: (response as any).refreshToken || '',
      expiresAt: response.expiresOn || new Date(Date.now() + 3600_000),
      account: response.account?.username || null,
    },
  })
}

async function getAccessToken(): Promise<string> {
  const token = await prisma.microsoftToken.findUnique({ where: { id: 'singleton' } })
  if (!token) throw new Error('Microsoft not connected. Please authenticate first.')

  if (token.expiresAt > new Date()) {
    return token.accessToken
  }

  const client = getMsalClient()
  const response = await client.acquireTokenByRefreshToken({
    refreshToken: token.refreshToken,
    scopes: SCOPES,
  })

  if (!response) throw new Error('Failed to refresh Microsoft token')

  await prisma.microsoftToken.update({
    where: { id: 'singleton' },
    data: {
      accessToken: response.accessToken,
      refreshToken: (response as any).refreshToken || token.refreshToken,
      expiresAt: response.expiresOn || new Date(Date.now() + 3600_000),
    },
  })

  return response.accessToken
}

function getGraphClient(accessToken: string): Client {
  return Client.init({
    authProvider: (done) => done(null, accessToken),
  })
}

export async function fetchEmails(folderId?: string, count = 20): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)

  const path = folderId
    ? `/me/mailFolders/${folderId}/messages`
    : '/me/messages'

  const response = await client.api(path)
    .top(count)
    .select('id,subject,bodyPreview,body,from,receivedDateTime')
    .orderby('receivedDateTime desc')
    .get()

  return response.value || []
}

export async function fetchTeamsMessages(chatId: string, count = 20): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)

  const response = await client.api(`/me/chats/${chatId}/messages`)
    .top(count)
    .get()

  return response.value || []
}

export async function fetchTeamsChannelMessages(teamId: string, channelId: string, count = 20): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)

  const response = await client.api(`/teams/${teamId}/channels/${channelId}/messages`)
    .top(count)
    .get()

  return response.value || []
}

export async function fetchSharePointItems(siteId: string, listId?: string): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)

  if (listId) {
    const response = await client.api(`/sites/${siteId}/lists/${listId}/items`)
      .expand('fields')
      .top(50)
      .get()
    return response.value || []
  }

  const response = await client.api(`/sites/${siteId}/drive/root/children`)
    .top(50)
    .get()
  return response.value || []
}

export async function listMailFolders(): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)
  const response = await client.api('/me/mailFolders').top(50).get()
  return response.value || []
}

export async function listTeamsChats(): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)
  const response = await client.api('/me/chats')
    .top(50)
    .select('id,topic,chatType,lastUpdatedDateTime')
    .orderby('lastUpdatedDateTime desc')
    .get()
  return response.value || []
}

export async function listJoinedTeams(): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)
  const response = await client.api('/me/joinedTeams').get()
  return response.value || []
}

export async function listTeamChannels(teamId: string): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)
  const response = await client.api(`/teams/${teamId}/channels`).get()
  return response.value || []
}

export async function listSharePointSites(): Promise<any[]> {
  const accessToken = await getAccessToken()
  const client = getGraphClient(accessToken)
  const response = await client.api('/sites?search=*').top(50).get()
  return response.value || []
}

export async function syncSource(configId: string): Promise<number> {
  const config = await prisma.syncConfig.findUnique({ where: { id: configId } })
  if (!config || !config.enabled) return 0

  let imported = 0

  if (config.source === 'EMAIL') {
    const emails = await fetchEmails(config.resourceId, 30)
    for (const email of emails) {
      const content = email.body?.content
        ? stripHtml(email.body.content)
        : email.bodyPreview || ''

      await prisma.businessContext.upsert({
        where: { source_externalId: { source: 'EMAIL', externalId: email.id } },
        create: {
          source: 'EMAIL',
          externalId: email.id,
          subject: email.subject || '(no subject)',
          content,
          date: email.receivedDateTime?.split('T')[0] || null,
        },
        update: { subject: email.subject || '(no subject)', content },
      })
      imported++
    }
  } else if (config.source === 'TEAMS') {
    const [teamId, channelId] = config.resourceId.split('/')
    const messages = channelId
      ? await fetchTeamsChannelMessages(teamId, channelId, 30)
      : await fetchTeamsMessages(teamId, 30)

    for (const msg of messages) {
      if (!msg.body?.content) continue
      const content = stripHtml(msg.body.content)
      if (!content.trim()) continue

      await prisma.businessContext.upsert({
        where: { source_externalId: { source: 'TEAMS', externalId: msg.id } },
        create: {
          source: 'TEAMS',
          externalId: msg.id,
          subject: `${msg.from?.user?.displayName || 'Unknown'}: ${content.slice(0, 80)}`,
          content,
          date: msg.createdDateTime?.split('T')[0] || null,
        },
        update: { content },
      })
      imported++
    }
  } else if (config.source === 'SHAREPOINT') {
    const [siteId, listId] = config.resourceId.split('/')
    const items = await fetchSharePointItems(siteId, listId)

    for (const item of items) {
      const name = item.fields?.Title || item.name || item.id
      const content = item.fields
        ? Object.entries(item.fields)
            .filter(([k]) => !k.startsWith('@') && !k.startsWith('_'))
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        : `File: ${name}`

      await prisma.businessContext.upsert({
        where: { source_externalId: { source: 'SHAREPOINT', externalId: item.id } },
        create: {
          source: 'SHAREPOINT',
          externalId: item.id,
          subject: name,
          content,
          date: item.lastModifiedDateTime?.split('T')[0] || null,
        },
        update: { subject: name, content },
      })
      imported++
    }
  }

  await prisma.syncConfig.update({
    where: { id: configId },
    data: { lastSync: new Date() },
  })

  return imported
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
