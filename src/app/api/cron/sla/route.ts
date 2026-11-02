import { fail, ok } from "@/lib/api";
import { runSla } from "@/lib/sla";

export const dynamic = "force-dynamic";

async function handle(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return fail("Unauthorized.", 401);
  return ok(await runSla());
}
export const GET = handle;
export const POST = handle;
