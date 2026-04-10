// routes/userRoutes.js
import { Router } from "express";
import { login } from "../auth/auth.js";
import * as controller from "../controllers/userController.js";

const router = Router();

router.get("/login", controller.showLogin);
router.post("/login", login, controller.handleLogin);
router.get("/register", controller.showRegister);
router.post("/register", controller.handleRegister);
router.get("/logout", controller.logout);

export default router;