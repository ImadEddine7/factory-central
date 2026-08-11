import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  program: z.string().optional(),
  active: z.boolean().default(true),
  revenue: z.number(),
})

export const PurchaseOrderSchema = z.object({
  projectId: z.string(),
  label: z.string().default(''),
  poRequested: z.number(),
  delivered: z.number(),
  poReceived: z.number(),
})

export const ImageSchema = z.object({
  src: z.string(),
  alt: z.string().default(''),
  layout: z.enum(['full', 'left', 'right']).default('full'),
})

export const KeyMessageSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  body: z.string(),
  tag: z.string().optional(),
  date: z.string().optional(),
  image: ImageSchema.optional(),
})

export const BarSchema = z.object({
  id: z.string(),
  label: z.string(),
  start: z.string(),
  end: z.string(),
  color: z.string().default('#2F6F6B'),
  progress: z.number().min(0).max(100).optional(),
  style: z.enum(['solid', 'hatched']).default('solid'),
})

export const MilestoneSchema = z.object({
  id: z.string(),
  month: z.string(),
  label: z.string(),
  color: z.string().default('#B4472F'),
})

export const PlanningRowSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['row', 'section']).default('row'),
  indent: z.number().default(0),
  bars: z.array(BarSchema).default([]),
  milestones: z.array(MilestoneSchema).default([]),
  hidden: z.boolean().default(false),
})

export const PlanningSchema = z.object({
  startMonth: z.string(),
  endMonth: z.string(),
  rows: z.array(PlanningRowSchema).default([]),
})

export const HeadcountEntrySchema = z.object({
  month: z.string(),
  offshore: z.number().default(0),
  onshore: z.number().default(0),
})

export const SettingsSchema = z.object({
  coverageThresholds: z.object({
    warning: z.number().default(80),
    healthy: z.number().default(95),
  }).default({ warning: 80, healthy: 95 }),
  palette: z.array(z.string()).default(['#2F6F6B', '#B4472F', '#4A5A8A', '#C08A2E', '#6B7A5A']),
})

export const MetaSchema = z.object({
  period: z.string(),
  title: z.string().default('Data Factory — Delivery Digest'),
  subtitle: z.string().default(''),
  publishedAt: z.string().optional(),
  author: z.string().default(''),
  currency: z.string().default('EUR'),
  unit: z.enum(['k', 'M', 'unit']).default('k'),
  status: z.enum(['draft', 'published']).default('draft'),
})

export const DigestSchema = z.object({
  meta: MetaSchema,
  projects: z.array(ProjectSchema).default([]),
  purchaseOrders: z.array(PurchaseOrderSchema).default([]),
  keyMessages: z.array(KeyMessageSchema).default([]),
  headcount: z.array(HeadcountEntrySchema).default([]),
  planning: PlanningSchema.default({ startMonth: '', endMonth: '', rows: [] }),
  settings: SettingsSchema.default({}),
})

export type Project = z.infer<typeof ProjectSchema>
export type PurchaseOrder = z.infer<typeof PurchaseOrderSchema>
export type KeyMessage = z.infer<typeof KeyMessageSchema>
export type Bar = z.infer<typeof BarSchema>
export type Milestone = z.infer<typeof MilestoneSchema>
export type PlanningRow = z.infer<typeof PlanningRowSchema>
export type Planning = z.infer<typeof PlanningSchema>
export type Settings = z.infer<typeof SettingsSchema>
export type DigestMeta = z.infer<typeof MetaSchema>
export type Digest = z.infer<typeof DigestSchema>
export type Image = z.infer<typeof ImageSchema>
export type HeadcountEntry = z.infer<typeof HeadcountEntrySchema>

export const IndexSchema = z.object({
  periods: z.array(z.object({
    period: z.string(),
    title: z.string(),
    publishedAt: z.string().optional(),
    status: z.enum(['draft', 'published']),
  })),
})

export type DigestIndex = z.infer<typeof IndexSchema>
