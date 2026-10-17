import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fail, limit, sameOrigin } from "@/lib/auth";
import { sqlClient } from "@/lib/store";
export async function POST(req: Request) {
  try {
    sameOrigin(req);
    limit(
      "image:" + (req.headers.get("x-forwarded-for")?.split(",")[0] || "local"),
      8,
    );
    const mime = req.headers.get("content-type")?.split(";")[0];
    const max = mime === "application/pdf" ? 3000000 : 1572864;
    if (Number(req.headers.get("content-length") || 0) > max)
      throw new Error("File is too large (PDF: 3 MB; JPEG: 1.5 MB).");
    const reader = req.body?.getReader();
    if (!reader) throw new Error("File is empty.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > max) {
        await reader.cancel();
        throw new Error("File is too large.");
      }
      chunks.push(part.value);
    }
    const data = Buffer.concat(chunks);
    const jpeg =
      mime === "image/jpeg" &&
      data[0] === 0xff &&
      data[1] === 0xd8 &&
      data[2] === 0xff &&
      data.at(-2) === 0xff &&
      data.at(-1) === 0xd9;
    const pdf =
      mime === "application/pdf" &&
      data.subarray(0, 5).toString() === "%PDF-" &&
      data.subarray(-2048).includes(Buffer.from("%%EOF"));
    if (!data.length || (!jpeg && !pdf))
      throw new Error("Upload a valid JPEG image or PDF file.");
    const id = crypto.randomUUID(),
      token = randomBytes(32).toString("hex");
    if (process.env.DATABASE_URL) {
      const sql = sqlClient();
      await sql`insert into "mediaUploads" (id,token,mime,data) values (${id},${token},${mime!},${data})`;
    } else {
      if (process.env.VERCEL)
        throw new Error("Image storage is not configured.");
      const dir = path.join(process.env.DEMO_DATA_DIR || ".data", "media");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, id + ".json"),
        JSON.stringify({ token, mime, data: data.toString("base64") }),
        { mode: 0o600 },
      );
    }
    return Response.json({ url: `/api/media/${id}?key=${token}` });
  } catch (e) {
    return fail(e);
  }
}
