import { db, staffTable } from "@workspace/db";
import { logger } from "./logger";
import { sql } from "drizzle-orm";

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
    const existing = await db.select().from(staffTable);
    const existingCount = existing.length;
    const targetCount = STAFF_SEED.length;

    if (existingCount === targetCount) {
      logger.info({ count: existingCount }, "Staff table is complete, skipping seed.");
      return;
    }

    logger.info({ existingCount, targetCount }, "Staff table is incomplete — syncing records...");

    // Build a map of canonical names (trimmed, lowercased) → seed entry
    const seedMap = new Map(
      STAFF_SEED.map(s => [s.name.trim().toLowerCase(), s])
    );

    // Map existing rows by normalised name
    const existingMap = new Map(
      existing.map(r => [r.name.trim().toLowerCase(), r])
    );

    // Clear out stale rows whose names are not in the canonical seed list
    // (only those without a barcode assigned, to protect real mappings)
    const staleRows = existing.filter(
      r => !seedMap.has(r.name.trim().toLowerCase()) && !r.barcodeId
    );
    for (const row of staleRows) {
      await db.execute(sql`DELETE FROM staff WHERE id = ${row.id} AND barcode_id IS NULL`);
      logger.info({ id: row.id, name: row.name }, "Removed stale staff record.");
    }

    // Insert missing records
    const missing = STAFF_SEED.filter(s => !existingMap.has(s.name.trim().toLowerCase()));
    if (missing.length > 0) {
      await db.insert(staffTable).values(missing);
      logger.info({ count: missing.length }, "Inserted missing staff records.");
    }

    // Fix blank departments for existing records
    for (const row of existing) {
      const canonical = seedMap.get(row.name.trim().toLowerCase());
      if (canonical && (!row.department || row.department !== canonical.department)) {
        await db.execute(
          sql`UPDATE staff SET department = ${canonical.department} WHERE id = ${row.id}`
        );
        logger.info({ id: row.id, name: row.name, department: canonical.department }, "Fixed department.");
      }
    }

    const finalCount = (await db.select().from(staffTable)).length;
    logger.info({ finalCount }, "Staff sync complete.");
  } catch (err) {
    logger.error({ err }, "Failed to seed staff table.");
  }
}
