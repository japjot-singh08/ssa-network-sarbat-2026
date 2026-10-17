import { z } from "zod";
export const mediaUrl = z
  .string()
  .regex(/^\/api\/media\/[a-f0-9-]{36}\?key=[a-f0-9]{64}$/)
  .or(z.literal(""));
