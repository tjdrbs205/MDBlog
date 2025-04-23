import { Router } from "express";
import v1Routes from "./v1.routes"; // v1 라우터 임포트

const router = Router();

// /api/v1
router.use("/api/v1", v1Routes);

export default router;
