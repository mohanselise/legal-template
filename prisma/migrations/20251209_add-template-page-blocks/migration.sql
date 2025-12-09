-- AlterTable
ALTER TABLE "TemplatePage" ADD COLUMN IF NOT EXISTS "blocks" JSONB,
ALTER COLUMN "htmlBody" SET DEFAULT '';
