import { Router, type IRouter } from "express";
import healthRouter from "./health";
import studentsRouter from "./students";
import statsRouter from "./stats";
import storageRouter from "./storage";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(authRouter);
router.use(healthRouter);
router.use(studentsRouter);
router.use(statsRouter);
router.use(storageRouter);

export default router;
