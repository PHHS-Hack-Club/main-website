ALTER TABLE "meetings"
  ADD COLUMN "summary" TEXT,
  ADD COLUMN "materials" TEXT,
  ADD COLUMN "summary_reminder_sent_at" TIMESTAMP(3);
