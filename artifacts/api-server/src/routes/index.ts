import { Router, type IRouter } from "express";
import healthRouter from "./health";
import eventsRouter from "./events";
import staffRouter from "./staff";
import attendanceRouter from "./attendance";

const router: IRouter = Router();

router.use(healthRouter);
router.use(eventsRouter);
router.use(staffRouter);
router.use(attendanceRouter);

export default router;
