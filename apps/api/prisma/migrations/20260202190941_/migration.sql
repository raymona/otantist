-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('adult', 'parent_managed');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('pending', 'active', 'suspended');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('fr', 'en');

-- CreateEnum
CREATE TYPE "AgeGroup" AS ENUM ('14-17', '18-25', '26-40', '40+');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('visible', 'limited', 'hidden');

-- CreateEnum
CREATE TYPE "TonePreference" AS ENUM ('gentle', 'direct', 'enthusiastic', 'formal');

-- CreateEnum
CREATE TYPE "ColorIntensity" AS ENUM ('standard', 'reduced', 'minimal');

-- CreateEnum
CREATE TYPE "SocialEnergyLevel" AS ENUM ('high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'emoji', 'system');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('queued', 'sent', 'delivered', 'read');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('active', 'blocked', 'archived');

-- CreateEnum
CREATE TYPE "FlagSource" AS ENUM ('user', 'ai', 'moderator', 'system');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'reviewing', 'resolved');

-- CreateEnum
CREATE TYPE "ModerationPriority" AS ENUM ('low', 'medium', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('dismissed', 'warned', 'removed', 'suspended');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('harassment', 'inappropriate', 'spam', 'safety_concern', 'other');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('flagged_message', 'stress_indicator', 'prolonged_calm_mode', 'inactivity');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('info', 'warning', 'urgent');

-- CreateEnum
CREATE TYPE "ParentRelationship" AS ENUM ('parent', 'legal_guardian', 'other');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('pending', 'active', 'ended');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "account_type" "AccountType" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'pending',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "invite_code_used" TEXT,
    "legal_accepted_at" TIMESTAMP(3),
    "preferred_language" "LanguageCode" NOT NULL DEFAULT 'fr',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "display_name" VARCHAR(50),
    "age_group" "AgeGroup",
    "profile_visibility" "ProfileVisibility" NOT NULL DEFAULT 'visible',
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "onboarding_step" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "created_by" TEXT,
    "max_uses" INTEGER NOT NULL DEFAULT 1,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_managed_accounts" (
    "id" TEXT NOT NULL,
    "parent_account_id" TEXT NOT NULL,
    "member_account_id" TEXT NOT NULL,
    "relationship" "ParentRelationship" NOT NULL,
    "consent_given_at" TIMESTAMP(3),
    "status" "RelationshipStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_managed_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "comm_modes" TEXT[],
    "preferred_tone" "TonePreference",
    "slow_replies_ok" BOOLEAN,
    "one_message_at_time" BOOLEAN,
    "read_without_reply" BOOLEAN,
    "section_complete" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "time_boundaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_of_week" SMALLINT NOT NULL,
    "available_start" VARCHAR(5) NOT NULL,
    "available_end" VARCHAR(5) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/Montreal',

    CONSTRAINT "time_boundaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_starters" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "good_topics" TEXT[],
    "avoid_topics" TEXT[],
    "interaction_tips" TEXT[],
    "section_complete" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_starters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensory_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "enable_animations" BOOLEAN NOT NULL DEFAULT false,
    "color_intensity" "ColorIntensity",
    "sound_enabled" BOOLEAN NOT NULL DEFAULT false,
    "notification_limit" SMALLINT,
    "notification_grouped" BOOLEAN NOT NULL DEFAULT true,
    "section_complete" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sensory_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_state" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "social_energy" "SocialEnergyLevel",
    "energy_updated_at" TIMESTAMP(3),
    "calm_mode_active" BOOLEAN NOT NULL DEFAULT false,
    "calm_mode_started" TIMESTAMP(3),
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "last_seen" TIMESTAMP(3),

    CONSTRAINT "user_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "content" TEXT NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'sent',
    "queued_reason" VARCHAR(100),
    "deliver_at" TIMESTAMP(3),
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagged_by" "FlagSource",
    "flagged_reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMP(3),
    "read_at" TIMESTAMP(3),

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moderation_queue" (
    "id" TEXT NOT NULL,
    "item_type" VARCHAR(20) NOT NULL,
    "item_id" TEXT NOT NULL,
    "flagged_by" "FlagSource" NOT NULL,
    "flag_reason" VARCHAR(255),
    "ai_confidence" DECIMAL(3,2),
    "status" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "priority" "ModerationPriority" NOT NULL DEFAULT 'medium',
    "reviewed_by" TEXT,
    "action_taken" "ModerationAction",
    "resolution_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "moderation_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_reports" (
    "id" TEXT NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_user_id" TEXT,
    "reported_message_id" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_alerts" (
    "id" TEXT NOT NULL,
    "parent_account_id" TEXT NOT NULL,
    "member_user_id" TEXT NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "severity" "AlertSeverity" NOT NULL,
    "message_fr" TEXT NOT NULL,
    "message_en" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_indicators" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recorded_at" DATE NOT NULL,
    "social_energy_avg" "SocialEnergyLevel",
    "calm_mode_minutes" INTEGER NOT NULL DEFAULT 0,
    "messages_sent" INTEGER NOT NULL DEFAULT 0,
    "messages_received" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "member_indicators_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "accounts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_account_id_key" ON "users"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "invite_codes_code_key" ON "invite_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "parent_managed_accounts_parent_account_id_member_account_id_key" ON "parent_managed_accounts"("parent_account_id", "member_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "communication_preferences_user_id_key" ON "communication_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_starters_user_id_key" ON "conversation_starters"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "sensory_preferences_user_id_key" ON "sensory_preferences"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_state_user_id_key" ON "user_state"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_user_a_id_user_b_id_key" ON "conversations"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blocked_users_blocker_id_blocked_id_key" ON "blocked_users"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "moderation_queue_status_priority_idx" ON "moderation_queue"("status", "priority");

-- CreateIndex
CREATE INDEX "parent_alerts_parent_account_id_acknowledged_idx" ON "parent_alerts"("parent_account_id", "acknowledged");

-- CreateIndex
CREATE UNIQUE INDEX "member_indicators_user_id_recorded_at_key" ON "member_indicators"("user_id", "recorded_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_codes" ADD CONSTRAINT "invite_codes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_managed_accounts" ADD CONSTRAINT "parent_managed_accounts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_managed_accounts" ADD CONSTRAINT "parent_managed_accounts_member_account_id_fkey" FOREIGN KEY ("member_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_preferences" ADD CONSTRAINT "communication_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_boundaries" ADD CONSTRAINT "time_boundaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_starters" ADD CONSTRAINT "conversation_starters_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensory_preferences" ADD CONSTRAINT "sensory_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_state" ADD CONSTRAINT "user_state_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moderation_queue" ADD CONSTRAINT "moderation_queue_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_reports" ADD CONSTRAINT "user_reports_reported_message_id_fkey" FOREIGN KEY ("reported_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_alerts" ADD CONSTRAINT "parent_alerts_parent_account_id_fkey" FOREIGN KEY ("parent_account_id") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_alerts" ADD CONSTRAINT "parent_alerts_member_user_id_fkey" FOREIGN KEY ("member_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_indicators" ADD CONSTRAINT "member_indicators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
