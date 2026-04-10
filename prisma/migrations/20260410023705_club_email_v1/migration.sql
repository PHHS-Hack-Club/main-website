-- CreateEnum
CREATE TYPE "MailboxStatus" AS ENUM ('PROVISIONED_AWAITING_PASSWORD', 'ACTIVE', 'SUSPENDED', 'PENDING_DELETION', 'DELETED');

-- CreateEnum
CREATE TYPE "EmailRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MailAuditAction" AS ENUM ('EMAIL_REQUEST_CREATED', 'EMAIL_REQUEST_EDITED', 'EMAIL_REQUEST_APPROVED', 'EMAIL_REQUEST_REJECTED', 'EMAIL_REQUEST_CANCELLED', 'MAILBOX_PROVISIONED', 'MAILBOX_PROVISION_FAILED', 'PASSWORD_SETUP_TOKEN_ISSUED', 'PASSWORD_SET_INITIAL', 'PASSWORD_CHANGED', 'PASSWORD_RESET_BY_ADMIN', 'MAILBOX_SUSPENDED', 'MAILBOX_UNSUSPENDED', 'MAILBOX_DELETION_SCHEDULED', 'MAILBOX_DELETED');

-- CreateTable
CREATE TABLE "email_requests" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "requested_local_part" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'phhshack.club',
    "status" "EmailRequestStatus" NOT NULL DEFAULT 'PENDING',
    "admin_override" BOOLEAN NOT NULL DEFAULT false,
    "admin_override_reason" TEXT,
    "rejection_reason" TEXT,
    "last_error" TEXT,
    "reviewed_by_member_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mailboxes" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "local_part" TEXT NOT NULL,
    "domain" TEXT NOT NULL DEFAULT 'phhshack.club',
    "status" "MailboxStatus" NOT NULL,
    "purelymail_user_id" TEXT,
    "provisioned_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "suspended_at" TIMESTAMP(3),
    "delete_after" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mailboxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_setup_tokens" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "mailbox_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "issued_by_member_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_setup_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mail_audit_log" (
    "id" TEXT NOT NULL,
    "action" "MailAuditAction" NOT NULL,
    "actor_member_id" TEXT,
    "subject_member_id" TEXT,
    "mailbox_id" TEXT,
    "email_request_id" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mail_audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reserved_local_parts" (
    "local_part" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reserved_local_parts_pkey" PRIMARY KEY ("local_part")
);

-- CreateIndex
CREATE INDEX "email_requests_member_id_idx" ON "email_requests"("member_id");

-- CreateIndex
CREATE INDEX "email_requests_status_idx" ON "email_requests"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mailboxes_member_id_key" ON "mailboxes"("member_id");

-- CreateIndex
CREATE INDEX "mailboxes_status_idx" ON "mailboxes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "mailboxes_local_part_domain_key" ON "mailboxes"("local_part", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "password_setup_tokens_token_hash_key" ON "password_setup_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_setup_tokens_member_id_idx" ON "password_setup_tokens"("member_id");

-- CreateIndex
CREATE INDEX "mail_audit_log_subject_member_id_idx" ON "mail_audit_log"("subject_member_id");

-- CreateIndex
CREATE INDEX "mail_audit_log_created_at_idx" ON "mail_audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "email_requests" ADD CONSTRAINT "email_requests_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mailboxes" ADD CONSTRAINT "mailboxes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
