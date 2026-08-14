export interface Article {
  id: string
  title: string
  body: string
  date: string
  pinned?: boolean
}

export interface HomeData {
  announcement: string
  articles: Article[]
}
