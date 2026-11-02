import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, rateLimited } from "@/lib/api";
import { FACILITY_TYPES } from "@/lib/constants";

const Body = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(FACILITY_TYPES),
  area: z.string().min(2).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  if (rateLimited(req, "register", 5)) return fail("Too many attempts. Try again in a minute.", 429);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Check the form. Every field is required and the password needs 8+ characters.");
  const d = parsed.data;
  const email = d.email.toLowerCase();
  if (await db.user.findUnique({ where: { email } })) return fail("An account with this email already exists.", 409);

  await db.facility.create({
    data: {
      name: d.name, type: d.type, area: d.area, lat: d.lat, lng: d.lng, phone: d.phone,
      users: { create: { email, passwordHash: await bcrypt.hash(d.password, 10), role: "FACILITY" } },
    },
  });
  return ok({ ok: true }, 201);
}
