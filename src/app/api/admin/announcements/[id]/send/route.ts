import { NextRequest, NextResponse } from "next/server";
import { getSession, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMemberEmail } from "@/lib/email";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session || !isAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) {
    return NextResponse.json(
      { error: "Announcement not found" },
      { status: 404 },
    );
  }
  if (!announcement.published) {
    return NextResponse.json(
      { error: "Publish announcement before sending" },
      { status: 400 },
    );
  }

  const members = await prisma.member.findMany({
    where: { schoolEmail: { not: null } },
    select: { schoolEmail: true },
  });

  const siteUrl = process.env.NEXT_PUBLIC_URL || "https://phhshack.club";

  await Promise.allSettled(
    members.map((m) =>
      sendMemberEmail({
        to: m.schoolEmail!,
        subject: announcement.title,
        badge: "PHHS Coding Club Announcement",
        heading: announcement.title,
        body: announcement.body,
        ctaLabel: "View on site",
        ctaUrl: `${siteUrl}/#announcements`,
      }),
    ),
  );

  await prisma.announcement.update({
    where: { id },
    data: { emailedAt: new Date() },
  })

  return NextResponse.json({ sent: members.length })
}
