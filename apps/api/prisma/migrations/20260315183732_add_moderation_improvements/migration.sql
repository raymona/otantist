-- AlterEnum
ALTER TYPE "AlertType" ADD VALUE 'moderation_action';

-- AlterTable
ALTER TABLE "moderation_queue" ADD COLUMN     "original_content" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "warning_count" INTEGER NOT NULL DEFAULT 0;
