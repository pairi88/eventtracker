import { Router, type IRouter } from "express";
import { db, staffTable, attendanceTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListStaffResponse,
  ScanBarcodeBody,
  ScanBarcodeResponse,
  AssignBarcodeParams,
  AssignBarcodeBody,
  AssignBarcodeResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/staff", async (req, res): Promise<void> => {
  const staff = await db.select().from(staffTable).orderBy(staffTable.name);
  res.json(ListStaffResponse.parse(staff.map(s => ({
    id: s.id,
    name: s.name,
    barcodeId: s.barcodeId ?? null,
    department: s.department ?? null,
  }))));
});

router.post("/staff/scan", async (req, res): Promise<void> => {
  const parsed = ScanBarcodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const { barcodeId, eventId } = parsed.data;

  const [staffMember] = await db.select().from(staffTable).where(eq(staffTable.barcodeId, barcodeId));

  if (!staffMember) {
    res.json(ScanBarcodeResponse.parse({
      status: "not_found",
      staff: null,
      attendance: null,
      message: "New ID detected - please assign to a staff member",
    }));
    return;
  }

  const [existingAttendance] = await db.select().from(attendanceTable).where(
    and(
      eq(attendanceTable.staffId, staffMember.id),
      eq(attendanceTable.eventId, eventId),
    )
  );

  if (existingAttendance) {
    res.json(ScanBarcodeResponse.parse({
      status: "already_checked_in",
      staff: {
        id: staffMember.id,
        name: staffMember.name,
        barcodeId: staffMember.barcodeId ?? null,
        department: staffMember.department ?? null,
      },
      attendance: {
        id: existingAttendance.id,
        staffId: existingAttendance.staffId,
        eventId: existingAttendance.eventId,
        staffName: staffMember.name,
        checkedInAt: existingAttendance.checkedInAt.toISOString(),
      },
      message: `Already checked in: ${staffMember.name}`,
    }));
    return;
  }

  const [newAttendance] = await db.insert(attendanceTable).values({
    staffId: staffMember.id,
    eventId: eventId,
  }).returning();

  res.json(ScanBarcodeResponse.parse({
    status: "recorded",
    staff: {
      id: staffMember.id,
      name: staffMember.name,
      barcodeId: staffMember.barcodeId ?? null,
      department: staffMember.department ?? null,
    },
    attendance: {
      id: newAttendance.id,
      staffId: newAttendance.staffId,
      eventId: newAttendance.eventId,
      staffName: staffMember.name,
      checkedInAt: newAttendance.checkedInAt.toISOString(),
    },
    message: `Recorded: ${staffMember.name}`,
  }));
});

router.put("/staff/:staffId/barcode", async (req, res): Promise<void> => {
  const params = AssignBarcodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const body = AssignBarcodeBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "validation_error", message: body.error.message });
    return;
  }

  const [existingStaff] = await db.select().from(staffTable).where(eq(staffTable.id, params.data.staffId));
  if (!existingStaff) {
    res.status(404).json({ error: "not_found", message: "Staff member not found" });
    return;
  }

  const [conflicting] = await db.select().from(staffTable).where(eq(staffTable.barcodeId, body.data.barcodeId));
  if (conflicting && conflicting.id !== params.data.staffId) {
    res.status(409).json({ error: "conflict", message: "Barcode already assigned to another staff member" });
    return;
  }

  const [updated] = await db.update(staffTable).set({ barcodeId: body.data.barcodeId }).where(eq(staffTable.id, params.data.staffId)).returning();

  res.json(AssignBarcodeResponse.parse({
    id: updated.id,
    name: updated.name,
    barcodeId: updated.barcodeId ?? null,
    department: updated.department ?? null,
  }));
});

export default router;
