import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFileUrl } from "@/lib/minio";
import type { Metadata } from "next";
import MarkdownPreview from "@/components/MarkdownPreview";
import ImageCarousel from "@/components/ImageCarousel";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      member: { select: { name: true } },
      images: { orderBy: { createdAt: "asc" }, take: 1 },
    },
  });

  if (!project) return { title: "Project · PHHS Hack Club" };

  const title = `${project.title || "Untitled"} · PHHS Hack Club`;
  const description = project.description
    ? project.description.replace(/[#*`_~[\]]/g, "").slice(0, 160)
    : `A project by ${project.member.name} at PHHS Hack Club.`;
  const image = project.images[0]
    ? getFileUrl(project.images[0].minioKey)
    : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

async function fetchHackatimeHours(
  projectName: string,
  memberId: string,
): Promise<string | null> {
  try {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: { hackatimeToken: true },
    });
    if (!member?.hackatimeToken) return null;

    const res = await fetch(
      "https://hackatime.hackclub.com/api/v1/authenticated/projects?include_archived=true",
      {
        headers: { Authorization: `Bearer ${member.hackatimeToken}` },
        next: { revalidate: 3600 },
      },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      projects: { name: string; total_seconds: number }[];
    };
    const project = (data.projects ?? []).find(
      (p) => p.name.toLowerCase() === projectName.toLowerCase(),
    );
    if (!project?.total_seconds) return null;

    const hours = Math.floor(project.total_seconds / 3600);
    const minutes = Math.floor((project.total_seconds % 3600) / 60);
    if (hours === 0) return `${minutes}m`;
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } catch {
    return null;
  }
}

export default async function GalleryProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, status: "APPROVED" },
    include: {
      member: { select: { id: true, name: true } },
      images: { orderBy: { createdAt: "asc" } },
      devlogs: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "asc" },
        include: {
          images: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });

  if (!project) notFound();

  const codingHours = project.hackatimeProject
    ? await fetchHackatimeHours(project.hackatimeProject, project.member.id)
    : null;

  return (
    <div
      className="container"
      style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-6)" }}
    >
      <div className="stack">
        {/* Back */}
        <Link
          href="/gallery"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            color: "var(--muted)",
            fontSize: "0.82rem",
            fontWeight: "bold",
          }}
        >
          ← Gallery
        </Link>

        {/* Header */}
        <div
          className="card animate-up"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 10% 50%, rgba(236, 55, 80, 0.06) 0%, var(--surface) 60%)",
            borderColor: "rgba(200, 190, 255, 0.12)",
          }}
        >
          <p
            style={{
              margin: "0 0 0.35rem",
              color: "var(--muted)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            {"// PROJECT"}
          </p>
          <h1
            className="glow-red"
            style={{ margin: "0 0 0.35rem", letterSpacing: "-0.02em" }}
          >
            {project.title || "Untitled project"}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.85rem",
              flexWrap: "wrap",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                margin: 0,
                color: "var(--muted)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-mono)",
              }}
            >
              by {project.member.name}
            </p>
            {codingHours && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "var(--radius-pill)",
                  background: "rgba(255, 140, 55, 0.1)",
                  border: "1px solid rgba(255, 140, 55, 0.25)",
                  color: "var(--orange)",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                }}
              >
                ⏱ {codingHours} logged
              </span>
            )}
          </div>

          {/* Links + tags */}
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--orange)",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                }}
              >
                GitHub ↗
              </a>
            )}
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  color: "var(--cyan)",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                }}
              >
                Demo ↗
              </a>
            )}
            {project.tags.length > 0 && (
              <>
                {(project.githubUrl || project.demoUrl) && (
                  <span style={{ color: "var(--dim)" }}>·</span>
                )}
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--muted)",
                      background: "var(--raised)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.18rem 0.5rem",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="card">
          <p
            style={{
              margin: "0 0 1rem",
              color: "var(--muted)",
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
            }}
          >
            {"// DESCRIPTION"}
          </p>
          <MarkdownPreview
            source={project.description}
            fallback="No description provided."
          />
        </div>

        {/* Screenshots */}
        {project.images.length > 0 && (
          <section className="stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Screenshots</h2>
            <ImageCarousel
              images={project.images.map((img) => ({
                id: img.id,
                src: getFileUrl(img.minioKey),
                alt: img.originalFilename,
              }))}
            />
          </section>
        )}

        {/* Devlogs */}
        {project.devlogs.length > 0 && (
          <section className="stack">
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>
              Devlogs
              <span
                style={{
                  color: "var(--muted)",
                  fontWeight: "normal",
                  fontSize: "0.9rem",
                  marginLeft: "0.6rem",
                }}
              >
                {project.devlogs.length}
              </span>
            </h2>
            <div className="stack">
              {project.devlogs.map((devlog) => (
                <article
                  key={devlog.id}
                  className="card stack"
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  <div
                    style={{
                      padding: "var(--space-3)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>
                        {devlog.title || "Untitled devlog"}
                      </h3>
                      <p
                        style={{
                          margin: "0.2rem 0 0",
                          color: "var(--dim)",
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {devlog.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <MarkdownPreview
                      source={devlog.body}
                      fallback="No content."
                    />
                    {devlog.images.length > 0 && (
                      <ImageCarousel
                        images={devlog.images.map((img) => ({
                          id: img.id,
                          src: getFileUrl(img.minioKey),
                          alt: img.originalFilename,
                        }))}
                        thumbHeight={160}
                        thumbMinWidth={200}
                      />
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
