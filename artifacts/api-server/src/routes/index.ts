import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import profileRouter from "./profile";
import medicationsRouter from "./medications";
import waterRouter from "./water";
import symptomsRouter from "./symptoms";
import exerciseRouter from "./exercise";
import nutritionRouter from "./nutrition";
import chatRouter from "./chat";
import riskRouter from "./risk";
import dashboardRouter from "./dashboard";
import reportRouter from "./report";
import emergencyRouter from "./emergency";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(medicationsRouter);
router.use(waterRouter);
router.use(symptomsRouter);
router.use(exerciseRouter);
router.use(nutritionRouter);
router.use(chatRouter);
router.use(riskRouter);
router.use(dashboardRouter);
router.use(reportRouter);
router.use(emergencyRouter);

export default router;
