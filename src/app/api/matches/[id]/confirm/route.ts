import { fail, ok, requireFacility } from "@/lib/api";
import { confirmMatch } from "@/lib/match";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const s = await requireFacility();
  if (!s) return fail("Sign in as a facility.", 401);
  const r = await confirmMatch(params.id, s.facilityId);
  return r.ok ? ok({ ok: true }) : fail(r.error, 409);
}
