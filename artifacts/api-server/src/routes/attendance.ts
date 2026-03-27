import { Router, type IRouter } from "express";
import { db, attendanceTable, staffTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  RecordAttendanceBody,
  GetEventAttendanceParams,
  GetEventAttendanceResponse,
  ExportAttendanceCsvParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = RecordAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { staffId, eventId } = parsed.data;

  const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.id, staffId));
  if (!staffMember) {
    res.status(404).json({ error: "not_found", message: "Staff member not found" });
    return;
  }

  const [existing] = await db.select().from(attendanceTable).where(
    and(eq(attendanceTable.staffId, staffId), eq(attendanceTable.eventId, eventId))
  );

  if (existing) {
    res.status(409).json({ error: "duplicate", message: `${staffMember.name} is already checked in` });
    return;
  }

  const [record] = await db.insert(attendanceTable).values({ staffId, eventId }).returning();

  res.status(201).json({
    id: record.id,
    staffId: record.staffId,
    eventId: record.eventId,
    staffName: staffMember.name,
    checkedInAt: record.checkedInAt.toISOString(),
  });
});

router.get("/attendance/event/:eventId", async (req, res): Promise<void> => {
  const params = GetEventAttendanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const records = await db
    .select({
      id: attendanceTable.id,
      staffId: attendanceTable.staffId,
      eventId: attendanceTable.eventId,
      staffName: staffTable.name,
      checkedInAt: attendanceTable.checkedInAt,
    })
    .from(attendanceTable)
    .innerJoin(staffTable, eq(attendanceTable.staffId, staffTable.id))
    .where(eq(attendanceTable.eventId, params.data.eventId))
    .orderBy(attendanceTable.checkedInAt);

  res.json(GetEventAttendanceResponse.parse(records.map(r => ({
    id: r.id,
    staffId: r.staffId,
    eventId: r.eventId,
    staffName: r.staffName,
    checkedInAt: r.checkedInAt.toISOString(),
  }))));
});

router.get("/attendance/event/:eventId/export", async (req, res): Promise<void> => {
  const params = ExportAttendanceCsvParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const records = await db
    .select({
      id: attendanceTable.id,
      staffId: attendanceTable.staffId,
      eventId: attendanceTable.eventId,
      staffName: staffTable.name,
      checkedInAt: attendanceTable.checkedInAt,
    })
    .from(attendanceTable)
    .innerJoin(staffTable, eq(attendanceTable.staffId, staffTable.id))
    .where(eq(attendanceTable.eventId, params.data.eventId))
    .orderBy(attendanceTable.checkedInAt);

  const csvLines = ["Name,Time Checked In", ...records.map(r =>
    `"${r.staffName}","${new Date(r.checkedInAt).toLocaleString()}"`
  )];

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-event-${params.data.eventId}.csv"`);
  res.send(csvLines.join("\n"));
});

export default router;
