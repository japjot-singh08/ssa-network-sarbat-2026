"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
export default function Callback() {
  const [message, setMessage] = useState("Verifying your link…");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function finish() {
      const hash = new URLSearchParams(location.hash.slice(1)),
        accessToken = hash.get("access_token"),
        refreshToken = hash.get("refresh_token");
      const recovery =
        hash.get("type") === "recovery" ||
        new URLSearchParams(location.search).get("next") === "password";
      const error = hash.get("error_description");
      history.replaceState({}, "", "/auth/callback");
      if (error) throw new Error(error);
      if (!accessToken || !refreshToken)
        throw new Error(
          "This link is missing verification details. Sign in, request a new email, or open the complete link from your inbox.",
        );
      const r = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "exchange", accessToken, refreshToken }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      location.replace("/?view=" + (recovery ? "password" : "dashboard"));
    }
    void finish().catch((e) => setMessage(e.message));
  }, []);
  return (
    <main className="boot">
      <h1>SSA Network</h1>
      <p role="status">{message}</p>
      <Link className="button" href="/?view=dashboard">
        Return to SSA Network
      </Link>
    </main>
  );
}
