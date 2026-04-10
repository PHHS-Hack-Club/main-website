/**
 * mail-provisioning.ts
 *
 * Core engine for approving an EmailRequest and provisioning a real mailbox
 * in Purelymail. The provisional password exists only as a local variable
 * and is NEVER logged, stored, or propagated in errors.
 */

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { getPurelymailClient, PurelymailError } from '@/lib/purelymail'
import { writeMailAudit } from '@/lib/mail-audit'
import { isValidLocalPart } from '@/lib/mail-naming'
import { checkCandidateAvailability } from '@/lib/mail-availability'

export interface ProvisionResult {
  mailboxId: string
  rawToken: string
  expiresAt: Date
}

export async function provisionMailbox(params: {
  requestId: string
  adminMemberId: string
  localPart?: string
  adminOverrideReason?: string
}): Promise<ProvisionResult> {
  const domain = process.env.PURELYMAIL_DOMAIN || 'phhshack.club'

  // Load and validate the request
  const emailRequest = await prisma.emailRequest.findUnique({
    where: { id: params.requestId },
    include: { member: { select: { id: true, email: true, name: true } } },
  })
  if (!emailRequest) throw new Error('Email request not found')
  if (emailRequest.status !== 'PENDING') throw new Error('Request is not pending')

  // Check member doesn't already have a mailbox
  const existingMailbox = await prisma.mailbox.findUnique({
    where: { memberId: emailRequest.memberId },
  })
  if (existingMailbox) throw new Error('Member already has a mailbox')

  const finalLocalPart = params.localPart ?? emailRequest.requestedLocalPart
  const isOverride = finalLocalPart !== emailRequest.requestedLocalPart

  if (!isValidLocalPart(finalLocalPart)) throw new Error('Invalid local part')

  // Check reserved & collision
  const avail = await checkCandidateAvailability([finalLocalPart], domain)
  const availability = avail.get(finalLocalPart)
  if (!availability?.available) {
    throw new Error(`Address unavailable: ${availability?.reason ?? 'unknown'}`)
  }

  // Step 1: create DB records optimistically (outside tx since Purelymail call follows)
  const mailbox = await prisma.$transaction(async (tx) => {
    const mb = await tx.mailbox.create({
      data: {
        memberId: emailRequest.memberId,
        localPart: finalLocalPart,
        domain,
        status: 'PROVISIONED_AWAITING_PASSWORD',
        provisionedAt: new Date(),
      },
    })
    await tx.emailRequest.update({
      where: { id: emailRequest.id },
      data: {
        status: 'APPROVED',
        reviewedByMemberId: params.adminMemberId,
        reviewedAt: new Date(),
        adminOverride: isOverride,
        adminOverrideReason: isOverride ? (params.adminOverrideReason ?? 'Admin modified') : null,
      },
    })
    await writeMailAudit(
      {
        action: 'EMAIL_REQUEST_APPROVED',
        actorMemberId: params.adminMemberId,
        subjectMemberId: emailRequest.memberId,
        emailRequestId: emailRequest.id,
        mailboxId: mb.id,
        metadata: { finalLocalPart, domain, isOverride },
      },
      tx,
    )
    return mb
  })

  // Step 2: Call Purelymail (outside any transaction)
  // Provisional password: generated here, sent to Purelymail, NEVER stored.
  const provisionalPassword = crypto.randomBytes(32).toString('base64url')
  try {
    await getPurelymailClient().createUser(finalLocalPart, provisionalPassword)
  } catch (err) {
    // Roll back: delete the mailbox row and revert request to PENDING
    await prisma.$transaction(async (tx) => {
      await tx.mailbox.delete({ where: { id: mailbox.id } })
      await tx.emailRequest.update({
        where: { id: emailRequest.id },
        data: {
          status: 'PENDING',
          reviewedByMemberId: null,
          reviewedAt: null,
          lastError: err instanceof PurelymailError ? err.message : 'Provisioning failed',
        },
      })
      await writeMailAudit(
        {
          action: 'MAILBOX_PROVISION_FAILED',
          actorMemberId: params.adminMemberId,
          subjectMemberId: emailRequest.memberId,
          emailRequestId: emailRequest.id,
          metadata: { error: err instanceof PurelymailError ? err.code : 'unknown' },
        },
        tx,
      )
    })
    throw new Error('Mailbox provisioning failed — request returned to pending')
  }

  // Step 3: Generate a one-time password setup token
  const rawToken = crypto.randomBytes(32).toString('base64url')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.$transaction(async (tx) => {
    await tx.passwordSetupToken.create({
      data: {
        memberId: emailRequest.memberId,
        mailboxId: mailbox.id,
        tokenHash,
        expiresAt,
        issuedByMemberId: params.adminMemberId,
      },
    })
    await writeMailAudit(
      {
        action: 'MAILBOX_PROVISIONED',
        actorMemberId: params.adminMemberId,
        subjectMemberId: emailRequest.memberId,
        emailRequestId: emailRequest.id,
        mailboxId: mailbox.id,
        metadata: { finalLocalPart, domain },
      },
      tx,
    )
    await writeMailAudit(
      {
        action: 'PASSWORD_SETUP_TOKEN_ISSUED',
        actorMemberId: params.adminMemberId,
        subjectMemberId: emailRequest.memberId,
        mailboxId: mailbox.id,
      },
      tx,
    )
  })

  return { mailboxId: mailbox.id, rawToken, expiresAt }
}
