-- CreateTable
CREATE TABLE "message_deletions" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_deletions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_hidden" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hidden_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_hidden_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_deletions_message_id_user_id_key" ON "message_deletions"("message_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_hidden_conversation_id_user_id_key" ON "conversation_hidden"("conversation_id", "user_id");

-- AddForeignKey
ALTER TABLE "message_deletions" ADD CONSTRAINT "message_deletions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_deletions" ADD CONSTRAINT "message_deletions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_hidden" ADD CONSTRAINT "conversation_hidden_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_hidden" ADD CONSTRAINT "conversation_hidden_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing "[Message deleted]" records: create MessageDeletion for the sender
INSERT INTO "message_deletions" ("id", "message_id", "user_id", "deleted_at")
SELECT gen_random_uuid(), m."id", m."sender_id", m."created_at"
FROM "messages" m
WHERE m."content" = '[Message deleted]' AND m."message_type" = 'system';
