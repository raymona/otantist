-- CreateEnum
CREATE TYPE "AuthTokenType" AS ENUM ('email_verification', 'password_reset');

-- CreateTable
CREATE TABLE "auth_tokens" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "token" VARCHAR(64) NOT NULL,
    "type" "AuthTokenType" NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "auth_tokens_token_key" ON "auth_tokens"("token");

-- CreateIndex
CREATE INDEX "auth_tokens_account_id_type_idx" ON "auth_tokens"("account_id", "type");

-- AddForeignKey
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
