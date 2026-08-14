import { api } from './client'
import type { Article, HomeData } from '../../apps/home/types'

export async function fetchHomeData(): Promise<HomeData> {
  const [ann, arts] = await Promise.all([
    api<{ text: string }>('/announcement'),
    api<{ articles: Article[] }>('/articles'),
  ])
  return { announcement: ann.text, articles: arts.articles }
}

export async function saveAnnouncement(text: string): Promise<void> {
  await api('/announcement', { method: 'PUT', body: JSON.stringify({ text }) })
}

export async function createArticle(article: Omit<Article, 'id'>): Promise<Article> {
  return api('/articles', { method: 'POST', body: JSON.stringify(article) })
}

export async function updateArticle(id: string, article: Partial<Article>): Promise<Article> {
  return api(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(article) })
}

export async function deleteArticle(id: string): Promise<void> {
  await api(`/articles/${id}`, { method: 'DELETE' })
}

export async function togglePin(id: string, pinned: boolean): Promise<void> {
  await api(`/articles/${id}/pin`, { method: 'PATCH', body: JSON.stringify({ pinned }) })
}
