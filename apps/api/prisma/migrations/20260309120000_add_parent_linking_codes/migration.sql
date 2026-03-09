-- CreateTable
CREATE TABLE "parent_linking_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "parent_account_id" TEXT NOT NULL,
    "used_by_account_id" TEXT,
    "relationship" "ParentRelationship" NOT NULL DEFAULT 'parent',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_linking_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parent_linking_codes_code_key" ON "parent_linking_codes"("code");

-- AddForeignKey
ALTER TABLE "parent_linking_codes" ADD CONSTRAINT "parent_linking_codes_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
