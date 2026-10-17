"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
export function ImageUpload({
  name = "imageUrl",
  onBusyChange,
  allowPdf = false,
}: {
  name?: string;
  allowPdf?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [isPdf, setIsPdf] = useState(false);
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  return (
    <div className="image-upload">
      <label className="field">
        <span>
          {allowPdf ? "Upload evidence (PDF or image)" : "Optional picture"}
        </span>
        <input
          type="file"
          accept={
            allowPdf
              ? "application/pdf,image/jpeg,image/png,image/webp"
              : "image/jpeg,image/png,image/webp"
          }
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            setUrl("");
            let objectUrl = "";
            try {
              setIsPdf(false);
              if (allowPdf && file.type === "application/pdf") {
                if (file.size > 3000000)
                  throw new Error("Use a PDF smaller than 3 MB.");
                const response = await fetch("/api/media", {
                  method: "POST",
                  headers: { "Content-Type": "application/pdf" },
                  body: file,
                });
                const result = await response.json();
                if (!response.ok)
                  throw new Error(result.error || "Upload failed.");
                setIsPdf(true);
                setUrl(result.url);
                return;
              }
              if (file.size > 12000000)
                throw new Error("Choose a picture smaller than 12 MB.");
              objectUrl = URL.createObjectURL(file);
              const img = new window.Image();
              img.src = objectUrl;
              await img.decode();
              const ratio = Math.min(1, 1600 / Math.max(img.width, img.height));
              const canvas = document.createElement("canvas");
              canvas.width = Math.max(1, Math.round(img.width * ratio));
              canvas.height = Math.max(1, Math.round(img.height * ratio));
              const ctx = canvas.getContext("2d");
              if (!ctx) throw new Error("Image conversion unavailable.");
              ctx.fillStyle = "#fff";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const blob = await new Promise<Blob>((resolve, reject) =>
                canvas.toBlob(
                  (b) =>
                    b
                      ? resolve(b)
                      : reject(new Error("Could not prepare picture.")),
                  "image/jpeg",
                  0.82,
                ),
              );
              const response = await fetch("/api/media", {
                method: "POST",
                headers: { "Content-Type": "image/jpeg" },
                body: blob,
              });
              const result = await response.json();
              if (!response.ok)
                throw new Error(result.error || "Upload failed.");
              setUrl(result.url);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              if (objectUrl) URL.revokeObjectURL(objectUrl);
              setBusy(false);
            }
          }}
        />
      </label>
      <input type="hidden" name={name} value={url} />
      {busy && <p role="status">Preparing and uploading file…</p>}
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      {url && (
        <>
          {isPdf ? (
            <a href={url} target="_blank" rel="noreferrer">
              Download uploaded PDF
            </a>
          ) : (
            <Image
              src={url}
              alt="Uploaded picture preview"
              width={600}
              height={400}
              unoptimized
              className="post-photo"
            />
          )}
          <button
            type="button"
            className="text-button"
            onClick={() => setUrl("")}
          >
            Remove file
          </button>
        </>
      )}
      <p className="small muted">
        Only upload files you have permission to share. Avoid private student or
        recipient information. Anyone with the full file link can view it.{" "}
        {allowPdf
          ? "PDFs: up to 3 MB. Images are resized before upload. Keep the link within your reviewer workflow."
          : "Pictures appear in Arena or the feed after publication."}
      </p>
    </div>
  );
}
