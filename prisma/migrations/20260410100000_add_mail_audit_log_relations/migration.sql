-- AddForeignKey
ALTER TABLE "mail_audit_log" ADD CONSTRAINT "mail_audit_log_actor_member_id_fkey" FOREIGN KEY ("actor_member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_audit_log" ADD CONSTRAINT "mail_audit_log_subject_member_id_fkey" FOREIGN KEY ("subject_member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mail_audit_log" ADD CONSTRAINT "mail_audit_log_mailbox_id_fkey" FOREIGN KEY ("mailbox_id") REFERENCES "mailboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
