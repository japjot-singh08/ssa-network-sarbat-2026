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
    if (Number(req.headers.get("content-length") || 0) > 1572864)
      throw new Error("Use an image smaller than 1.5 MB.");
    const data = Buffer.from(await req.arrayBuffer());
    if (
      !data.length ||
      data.length > 1572864 ||
      data[0] !== 0xff ||
      data[1] !== 0xd8 ||
      data[2] !== 0xff ||
      data.at(-2) !== 0xff ||
      data.at(-1) !== 0xd9
    )
      throw new Error("Upload a valid JPEG image smaller than 1.5 MB.");
    const id = crypto.randomUUID(),
      token = randomBytes(32).toString("hex");
    if (process.env.DATABASE_URL) {
      const sql = sqlClient();
      await sql`insert into "mediaUploads" (id,token,mime,data) values (${id},${token},'image/jpeg',${data})`;
    } else {
      if (process.env.VERCEL)
        throw new Error("Image storage is not configured.");
      const dir = path.join(process.env.DEMO_DATA_DIR || ".data", "media");
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, id + ".json"),
        JSON.stringify({ token, data: data.toString("base64") }),
        { mode: 0o600 },
      );
    }
    return Response.json({ url: `/api/media/${id}?key=${token}` });
  } catch (e) {
    return fail(e);
  }
}
