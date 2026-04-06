import { Router, type IRouter } from "express";
import { db, eventsTable, attendanceTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateEventBody,
  GetEventParams,
  GetEventResponse,
  ListEventsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/events", async (req, res): Promise<void> => {
  const events = await db.select().from(eventsTable).orderBy(eventsTable.createdAt);
  res.json(ListEventsResponse.parse(events.map(e => ({
    id: e.id,
    name: e.name,
    dateTime: e.dateTime,
    location: e.location,
    createdAt: e.createdAt.toISOString(),
  }))));
});

router.post("/events", async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "validation_error", message: parsed.error.message });
    return;
  }

  const [event] = await db.insert(eventsTable).values({
    name: parsed.data.name,
    dateTime: parsed.data.dateTime,
    location: parsed.data.location,
  }).returning();

  res.status(201).json(GetEventResponse.parse({
    id: event.id,
    name: event.name,
    dateTime: event.dateTime,
    location: event.location,
    createdAt: event.createdAt.toISOString(),
  }));
});

router.get("/events/:eventId", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) {
    res.status(404).json({ error: "not_found", message: "Event not found" });
    return;
  }

  res.json(GetEventResponse.parse({
    id: event.id,
    name: event.name,
    dateTime: event.dateTime,
    location: event.location,
    createdAt: event.createdAt.toISOString(),
  }));
});

router.delete("/events/:eventId", async (req, res): Promise<void> => {
  const params = GetEventParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "validation_error", message: params.error.message });
    return;
  }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, params.data.eventId));
  if (!event) {
    res.status(404).json({ error: "not_found", message: "Event not found" });
    return;
  }

  await db.delete(attendanceTable).where(eq(attendanceTable.eventId, params.data.eventId));
  await db.delete(eventsTable).where(eq(eventsTable.id, params.data.eventId));

  res.status(204).send();
});

export default router;
