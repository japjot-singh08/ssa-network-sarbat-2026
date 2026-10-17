import { readFile } from "node:fs/promises";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { sqlClient } from "@/lib/store";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params,
      key = new URL(req.url).searchParams.get("key") || "";
    if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(key))
      return new Response("Not found", { status: 404 });
    let data: Buffer, token: string;
    if (process.env.DATABASE_URL) {
      const sql = sqlClient();
      const rows =
        await sql`select token,data from "mediaUploads" where id=${id}`;
      if (!rows.length) return new Response("Not found", { status: 404 });
      token = rows[0].token;
      data = rows[0].data;
    } else {
      const item = JSON.parse(
        await readFile(
          path.join(
            process.env.DEMO_DATA_DIR || ".data",
            "media",
            id + ".json",
          ),
          "utf8",
        ),
      );
      token = item.token;
      data = Buffer.from(item.data, "base64");
    }
    if (!timingSafeEqual(Buffer.from(key), Buffer.from(token)))
      return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/jpeg",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
