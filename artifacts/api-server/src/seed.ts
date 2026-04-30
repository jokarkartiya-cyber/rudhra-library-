import { db, studentsTable, pool } from "@workspace/db";
import { generateCardId } from "./lib/cardId";

async function main() {
  const existing = await db.select().from(studentsTable);
  if (existing.length > 0) {
    console.log(`Already have ${existing.length} students. Skipping seed.`);
    await pool.end();
    return;
  }

  const year = new Date().getFullYear();
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const addDays = (d: Date, days: number) => {
    const r = new Date(d);
    r.setDate(r.getDate() + days);
    return r;
  };

  const seeds = [
    {
      cardId: generateCardId(year, 1),
      name: "Rohit Sharma",
      fatherName: "Suresh Sharma",
      email: "rohit.sharma@example.com",
      phone: "9876543210",
      address: "Kamla Nagar, Agra, Uttar Pradesh",
      photoUrl: null,
      seatNumber: "A-12",
      shift: "Morning",
      joinDate: fmt(addDays(today, -20)),
      validUntil: fmt(addDays(today, 10)),
      feesPaid: 1200,
      feesAmount: 1200,
    },
    {
      cardId: generateCardId(year, 2),
      name: "Priya Verma",
      fatherName: "Anil Verma",
      email: "priya.verma@example.com",
      phone: "9123456780",
      address: "Sanjay Place, Agra, Uttar Pradesh",
      photoUrl: null,
      seatNumber: "B-04",
      shift: "Full Day",
      joinDate: fmt(addDays(today, -45)),
      validUntil: fmt(addDays(today, 15)),
      feesPaid: 2000,
      feesAmount: 2000,
    },
    {
      cardId: generateCardId(year, 3),
      name: "Aman Yadav",
      fatherName: "Ramesh Yadav",
      email: "aman.yadav@example.com",
      phone: "9988776655",
      address: "Dayalbagh, Agra, Uttar Pradesh",
      photoUrl: null,
      seatNumber: "C-07",
      shift: "Evening",
      joinDate: fmt(addDays(today, -90)),
      validUntil: fmt(addDays(today, -5)),
      feesPaid: 1500,
      feesAmount: 1500,
    },
    {
      cardId: generateCardId(year, 4),
      name: "Sneha Singh",
      fatherName: "Rajeev Singh",
      email: "sneha.singh@example.com",
      phone: "9012345678",
      address: "Sikandra, Agra, Uttar Pradesh",
      photoUrl: null,
      seatNumber: "A-21",
      shift: "Night",
      joinDate: fmt(addDays(today, -7)),
      validUntil: fmt(addDays(today, 23)),
      feesPaid: 1800,
      feesAmount: 1800,
    },
    {
      cardId: generateCardId(year, 5),
      name: "Vikash Kumar",
      fatherName: "Manoj Kumar",
      email: "vikash.kumar@example.com",
      phone: "9090909090",
      address: "Tajganj, Agra, Uttar Pradesh",
      photoUrl: null,
      seatNumber: "B-15",
      shift: "Afternoon",
      joinDate: fmt(addDays(today, -2)),
      validUntil: fmt(addDays(today, 28)),
      feesPaid: 1500,
      feesAmount: 1500,
    },
  ];

  await db.insert(studentsTable).values(seeds);
  console.log(`Seeded ${seeds.length} students.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
