import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, requireFacility } from "@/lib/api";
import { CATEGORIES, SUBTYPES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireFacility();
  if (!s) return fail("Sign in as a facility.", 401);
  const [items, facility] = await Promise.all([
    db.inventoryItem.findMany({ where: { facilityId: s.facilityId }, orderBy: [{ category: "asc" }, { subtype: "asc" }] }),
    db.facility.findUnique({ where: { id: s.facilityId } }),
  ]);
  return ok({ items, facility });
}

const Upsert = z.object({ category: z.enum(CATEGORIES), subtype: z.string(), quantity: z.number().int().min(0).max(100000) });

export async function POST(req: Request) {
  const s = await requireFacility();
  if (!s) return fail("Sign in as a facility.", 401);
  const parsed = Upsert.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !SUBTYPES[parsed.data.category].includes(parsed.data.subtype)) return fail("Choose a resource type and a quantity of 0 or more.");
  const { category, subtype, quantity } = parsed.data;
  const item = await db.inventoryItem.upsert({
    where: { facilityId_category_subtype: { facilityId: s.facilityId, category, subtype } },
    update: { quantity },
    create: { facilityId: s.facilityId, category, subtype, quantity },
  });
  return ok(item);
}

export async function PUT(req: Request) {
  const s = await requireFacility();
  if (!s) return fail("Sign in as a facility.", 401);
  const parsed = z.object({ id: z.string(), quantity: z.number().int().min(0).max(100000) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Enter a quantity of 0 or more.");
  const r = await db.inventoryItem.updateMany({ where: { id: parsed.data.id, facilityId: s.facilityId }, data: { quantity: parsed.data.quantity } });
  return r.count ? ok({ ok: true }) : fail("Item not found.", 404);
}

export async function DELETE(req: Request) {
  const s = await requireFacility();
  if (!s) return fail("Sign in as a facility.", 401);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return fail("Missing item id.");
  await db.inventoryItem.deleteMany({ where: { id, facilityId: s.facilityId } });
  return ok({ ok: true });
}
