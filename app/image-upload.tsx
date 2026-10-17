"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
export function ImageUpload({
  name = "imageUrl",
  onBusyChange,
}: {
  name?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  return (
    <div className="image-upload">
      <label className="field">
        <span>Optional picture</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError("");
            setUrl("");
            let objectUrl = "";
            try {
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
      {busy && <p role="status">Preparing and uploading picture…</p>}
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
      {url && (
        <>
          <Image
            src={url}
            alt="Uploaded picture preview"
            width={600}
            height={400}
            unoptimized
            className="post-photo"
          />
          <button
            type="button"
            className="text-button"
            onClick={() => setUrl("")}
          >
            Remove picture
          </button>
        </>
      )}
      <p className="small muted">
        Only upload pictures you have permission to share. Avoid private student
        or recipient information. Pictures appear in Arena or the feed after
        publication; anyone with the image link can view it.
      </p>
    </div>
  );
}
