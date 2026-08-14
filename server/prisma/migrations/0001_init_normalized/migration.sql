warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "DigestStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digests" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Data Factory — Delivery Digest',
    "subtitle" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "unit" TEXT NOT NULL DEFAULT 'k',
    "status" "DigestStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "planningStartMonth" TEXT NOT NULL DEFAULT '',
    "planningEndMonth" TEXT NOT NULL DEFAULT '',
    "coverageWarning" DOUBLE PRECISION NOT NULL DEFAULT 80,
    "coverageHealthy" DOUBLE PRECISION NOT NULL DEFAULT 95,
    "palette" TEXT[] DEFAULT ARRAY['#2F6F6B', '#B4472F', '#4A5A8A', '#C08A2E', '#6B7A5A']::TEXT[],
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "digestId" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "poRequested" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delivered" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "poReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "headcount_entries" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "offshore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "onshore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "digestId" TEXT NOT NULL,

    CONSTRAINT "headcount_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_messages" (
    "id" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL DEFAULT '',
    "tag" TEXT,
    "date" TEXT,
    "image" JSONB,
    "digestId" TEXT NOT NULL,

    CONSTRAINT "key_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planning_rows" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'row',
    "indent" INTEGER NOT NULL DEFAULT 0,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "digestId" TEXT NOT NULL,

    CONSTRAINT "planning_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bars" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "start" TEXT NOT NULL,
    "end" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#2F6F6B',
    "progress" DOUBLE PRECISION,
    "style" TEXT NOT NULL DEFAULT 'solid',
    "order" INTEGER NOT NULL DEFAULT 0,
    "rowId" TEXT NOT NULL,

    CONSTRAINT "bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#B4472F',
    "rowId" TEXT NOT NULL,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "text" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "period" TEXT,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New conversation',
    "messages" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "digests_period_key" ON "digests"("period");

-- CreateIndex
CREATE UNIQUE INDEX "headcount_entries_digestId_month_key" ON "headcount_entries"("digestId", "month");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "digests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "headcount_entries" ADD CONSTRAINT "headcount_entries_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "digests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_messages" ADD CONSTRAINT "key_messages_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "digests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planning_rows" ADD CONSTRAINT "planning_rows_digestId_fkey" FOREIGN KEY ("digestId") REFERENCES "digests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bars" ADD CONSTRAINT "bars_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "planning_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_rowId_fkey" FOREIGN KEY ("rowId") REFERENCES "planning_rows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

