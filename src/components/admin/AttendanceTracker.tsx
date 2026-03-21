"use client";

import { use, useEffect, useState } from "react";

interface AttendanceMember {
  id: string;
  name: string;
  email: string;
  role: "PRESIDENT" | "VP" | "MEMBER";
  present: boolean;
}

export default function AttendanceTracker() {
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/attendance?date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load attendance");
        return res.json();
      })
      .then((data) => setMembers(data.members))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date]);

  async function toggle(memberId: string, present: boolean) {
    setTogglingId(memberId);
    setError("");

    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, date, present }),
      });

      if (!res.ok) throw new Error("Failed to update attendance");

      setMembers((current) =>
        current.map((m) => (m.id === memberId ? { ...m, present } : m)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setTogglingId(null);
    }
  }

  const presentCount = members.filter((m) => m.present).length;

  return (
    <div className="stack" style={{ gap: "0.75rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="field"
          style={{ maxWidth: 200 }}
        />
        {!loading && (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {presentCount} / {members.length} present
          </p>
        )}
      </div>

      {error && <p style={{ color: "var(--red)", margin: 0 }}>{error}</p>}

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : (
        <div className="table-wrap surface" style={{ padding: "0.5rem 1rem" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Present</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td style={{ color: "var(--muted)" }}>{member.role}</td>
                  <td>
                    <button
                      type="button"
                      className={member.present ? "btn-primary" : "btn-ghost"}
                      style={{ minHeight: 36, padding: "0.55rem 0.9rem" }}
                      disabled={togglingId === member.id}
                      onClick={() => toggle(member.id, !member.present)}
                    >
                      {member.present ? "Present" : "Absent"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
