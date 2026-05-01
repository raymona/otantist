-- CreateEnum
CREATE TYPE "InviteRequestStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "RequesterContext" AS ENUM ('parent', 'adult', 'organization');

-- CreateTable
CREATE TABLE "invite_requests" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "context" "RequesterContext" NOT NULL,
    "message" VARCHAR(1000),
    "language" "LanguageCode" NOT NULL DEFAULT 'fr',
    "status" "InviteRequestStatus" NOT NULL DEFAULT 'pending',
    "invite_code_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_requests_invite_code_id_key" ON "invite_requests"("invite_code_id");

-- CreateIndex
CREATE INDEX "invite_requests_status_created_at_idx" ON "invite_requests"("status", "created_at");

-- AddForeignKey
ALTER TABLE "invite_requests" ADD CONSTRAINT "invite_requests_invite_code_id_fkey" FOREIGN KEY ("invite_code_id") REFERENCES "invite_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
