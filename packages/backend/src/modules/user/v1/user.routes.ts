import e, { Router } from "express";
import UserController from "./user.controller";

const router = Router();
const userController = new UserController();

// POST /api/users/login - 사용자 로그인
router.post("/login", userController.login); // 사용자 목록 조회

export default router;
