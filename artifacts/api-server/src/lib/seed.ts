import { db, staffTable } from "@workspace/db";
import { logger } from "./logger";

const STAFF_SEED = [
  { name: "Philip Gibbs", department: "President" },
  { name: "Iwona Kolodziejczy", department: "VP Academic Affairs" },
  { name: "Julie Ruene", department: "VP Planning & Development" },
  { name: "Joe Williams Lalie", department: "VP Operations" },
  { name: "Fiona N'Drower", department: "Dean of FBI" },
  { name: "Sr. Miriam Dlugosz", department: "Dean of FASS" },
  { name: "Harry Aigeeleng", department: "Dean of FMHS" },
  { name: "Joseph Lingawa", department: "Dean of FED" },
  { name: "Clement Ananias", department: "Business Studies HoD" },
  { name: "Helen Gimbo", department: "Tourism & Hospitality HoD" },
  { name: "Jonathan Zureo", department: "Information Systems HoD" },
  { name: "Lyall Dale", department: "Mathematics & Computing Sciences HoD" },
  { name: "Otto Kerua", department: "Finance & Management HoD" },
  { name: "Jerzy Kuzma", department: "Medicine & Surgery HoD" },
  { name: "Gigil Marme", department: "Health Management Systems Development HoD" },
  { name: "Alphones Begani", department: "Environmental Health- HoD" },
  { name: "Elisabeth Schuele", department: "Public Health Leadership & Training HoD" },
  { name: "Rhonda Wohemani", department: "Rehabilitation Sciences HoD" },
  { name: "Karika Lynne Anea", department: "Health Extension HoD" },
  { name: "Leah Mariwo", department: "Nursing Tutor- FMHS, Wewak Campus" },
  { name: "Lomot Rodney", department: "Nursing HoD, Rabaul Campus" },
  { name: "Lorraine Morlin", department: "Governance & Leadership HoD" },
  { name: "Gabriel Kuman", department: "Social & Religious Studies HoD" },
  { name: "Gordian Kuias", department: "PNG International Studies" },
  { name: "Patrick Matbob", department: "Communication Arts HoD" },
  { name: "Peter Kelaki", department: "Education Curriculum & Leadership HoD" },
  { name: "Fhox Yengaha", department: "FED HoD- Rabaul Campus" },
  { name: "Carol Leo", department: "Humanities- FED, Wewak Campus" },
  { name: "Salome Yegiora", department: "Director Hunan Resource Management" },
  { name: "Evelyn Tekepa", department: "Director Student Services" },
  { name: "Tesilia Karai", department: "Bursar" },
  { name: "Deborah Pranis", department: "Director Marketing" },
  { name: "Gabriel Kambe", department: "ICT System Administrator" },
  { name: "Madeline Lemeki", department: "Director Research & Higher Degrees" },
  { name: "Ali Clare Aribi", department: "Registrar" },
  { name: "Susan Gandi", department: "Director Library" },
  { name: "Salote Kaumu", department: "FLC Coordinator" },
  { name: "Picky Airi", department: "Director CfLT" },
  { name: "Steven Miroi", department: "CfLT- Wewak Campus" },
  { name: "Lawrence Angeli", department: "CfLT- Rabaul Campus" },
  { name: "Conrad Darius Pirita", department: "CfLT- Port Moresby Campus" },
  { name: "Hobson Arro", department: "CfLT" },
  { name: "Liam Aldan", department: "CfLT" },
  { name: "Barry Sinemaue", department: "CfLT" },
  { name: "Stella Paulus", department: "CfLT" },
  { name: "Michaelyn Vamilat", department: "CfLT" },
];

export async function seedStaffIfEmpty(): Promise<void> {
  try {
    const existing = await db.select().from(staffTable).limit(1);
    if (existing.length > 0) {
      logger.info("Staff table already has records, skipping seed.");
      return;
    }

    logger.info("Staff table is empty — seeding staff records...");
    await db.insert(staffTable).values(STAFF_SEED);
    logger.info({ count: STAFF_SEED.length }, "Staff seed complete.");
  } catch (err) {
    logger.error({ err }, "Failed to seed staff table.");
  }
}
