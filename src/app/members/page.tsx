import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/minio";

function formatSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

async function fetchTotalSeconds(token: string): Promise<number> {
  try {
    const res = await fetch(
      "https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true",
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return 0;
    const data = (await res.json()) as {
      projects: { total_seconds: number }[];
    };
    return (data.projects ?? []).reduce((sum, p) => sum + p.total_seconds, 0);
  } catch {
    return 0;
  }
}

const roleOrder = { PRESIDENT: 0, VP: 1, MEMBER: 2 } as const;
const roleLabel = {
  PRESIDENT: "President",
  VP: "VP",
  MEMBER: "Member",
} as const;
const roleColor = {
  PRESIDENT: {
    color: "var(--red)",
    bg: "rgba(236,55,80,0.1)",
    border: "rgba(236,55,80,0.25)",
  },
  VP: {
    color: "var(--purple)",
    bg: "rgba(167,139,250,0.1)",
    border: "rgba(167,139,250,0.25)",
  },
  MEMBER: {
    color: "var(--muted)",
    bg: "var(--raised)",
    border: "var(--border)",
  },
} as const;

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      hackatimeToken: true,
      profilePictureKey: true,
      _count: { select: { projects: { where: { status: "APPROVED" } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const rows = await Promise.all(
    members.map(async (m) => ({
      ...m,
      totalSeconds: m.hackatimeToken
        ? await fetchTotalSeconds(m.hackatimeToken)
        : 0,
    })),
  );

  rows.sort((a, b) => {
    const roleDiff = roleOrder[a.role] - roleOrder[b.role];
    if (roleDiff !== 0) return roleDiff;
    return b.totalSeconds - a.totalSeconds;
  });

  return (
    <div
      className="container"
      style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-5)" }}
    >
      <div className="stack">
        <div className="animate-up">
          <p
            style={{
              margin: "0 0 0.5rem",
              color: "var(--muted)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            {"// MEMBERS"}
          </p>
          <h1
            className="glow-red"
            style={{
              fontSize: "clamp(2.5rem, 5vw, 4rem)",
              marginBottom: "0.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            Who we are.
          </h1>
          <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem" }}>
            {rows.length} members building things at PHHS.
          </p>
        </div>

        <div className="grid-cards">
          {rows.map((member, i) => {
            const rc = roleColor[member.role];
            return (
              <article
                key={member.id}
                className="card animate-up"
                style={{ animationDelay: `${0.05 * i}s` }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    {member.profilePictureKey ? (
                      <img
                        src={getFileUrl(member.profilePictureKey)}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--raised)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          color: "var(--dim)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {member.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                    )}
                    <h2 style={{ margin: 0, fontSize: "1rem" }}>{member.name}</h2>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      border: `1px solid ${rc.border}`,
                      color: rc.color,
                      background: rc.bg,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {roleLabel[member.role]}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div>
                    <p
                      style={{
                        margin: "0 0 0.2rem",
                        fontWeight: 800,
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.1rem",
                      }}
                    >
                      {member._count.projects}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: "var(--dim)",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      projects
                    </p>
                  </div>
                  {member.totalSeconds > 0 && (
                    <div>
                      <p
                        style={{
                          margin: "0 0 0.2rem",
                          color: "var(--orange)",
                          fontWeight: 800,
                          fontFamily: "var(--font-mono)",
                          fontSize: "1.1rem",
                        }}
                      >
                        {formatSeconds(member.totalSeconds)}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          color: "var(--dim)",
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        coded
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
