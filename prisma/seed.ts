import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const FACILITIES = [
  { name: "City Care Hospital", type: "HOSPITAL", area: "Connaught Place, Delhi", lat: 28.6315, lng: 77.2167, phone: "+91 11 4000 1001" },
  { name: "Lifeline Blood Bank", type: "BLOOD_BANK", area: "Karol Bagh, Delhi", lat: 28.6519, lng: 77.1909, phone: "+91 11 4000 1002" },
  { name: "Saket Medical Centre", type: "HOSPITAL", area: "Saket, Delhi", lat: 28.5245, lng: 77.2066, phone: "+91 11 4000 1003" },
  { name: "Dwarka Red Cross Blood Centre", type: "BLOOD_BANK", area: "Dwarka, Delhi", lat: 28.5921, lng: 77.046, phone: "+91 11 4000 1004" },
  { name: "Noida Oxygen Seva (NGO)", type: "NGO", area: "Noida Sector 62", lat: 28.627, lng: 77.3649, phone: "+91 120 400 1005" },
  { name: "Greater Noida Care Hospital", type: "HOSPITAL", area: "Greater Noida, Knowledge Park", lat: 28.4744, lng: 77.504, phone: "+91 120 400 1006" },
  { name: "Rohini MedPlus Pharmacy", type: "PHARMACY", area: "Rohini, Delhi", lat: 28.7383, lng: 77.0822, phone: "+91 11 4000 1007" },
] as const;

const STOCK: Record<string, [string, string, number][]> = {
  HOSPITAL: [["ICU_BED", "ICU", 4], ["VENTILATOR", "Standard", 3], ["OXYGEN", "Cylinder", 12], ["BLOOD", "O+", 6], ["BLOOD", "B+", 4]],
  BLOOD_BANK: [["BLOOD", "O-", 5], ["BLOOD", "O+", 14], ["BLOOD", "A+", 9], ["BLOOD", "B+", 7], ["BLOOD", "AB-", 2], ["BLOOD", "A-", 3]],
  PHARMACY: [["OXYGEN", "Cylinder", 8]],
  NGO: [["OXYGEN", "Cylinder", 20], ["BLOOD", "O+", 3]],
};

async function main() {
  const hash = await bcrypt.hash("demo1234", 10);
  await db.user.upsert({
    where: { email: "admin@critimatch.dev" }, update: {},
    create: { email: "admin@critimatch.dev", passwordHash: await bcrypt.hash("admin1234", 10), role: "ADMIN" },
  });
  let i = 1;
  for (const f of FACILITIES) {
    const email = `facility${i}@critimatch.dev`;
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      await db.facility.create({
        data: {
          ...f, verified: true,
          users: { create: { email, passwordHash: hash, role: "FACILITY" } },
          inventory: { create: STOCK[f.type].map(([category, subtype, quantity]) => ({ category: category as never, subtype, quantity })) },
        },
      });
    }
    i++;
  }
  console.log("Seeded. Admin: admin@critimatch.dev / admin1234. Facilities: facility1..7@critimatch.dev / demo1234");
}

main().finally(() => db.$disconnect());
