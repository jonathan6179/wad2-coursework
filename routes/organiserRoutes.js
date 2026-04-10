// routes/organiserRoutes.js
import { Router } from "express";
import { verify, requireOrganiser } from "../auth/auth.js";
import * as controller from "../controllers/organiserController.js";

const router = Router();

// All organiser routes require a valid JWT and the organiser role
router.use(verify, requireOrganiser);

router.get("/", controller.dashboard);

// Course management
router.get("/courses/new", controller.showAddCourse);
router.post("/courses", controller.postAddCourse);
router.get("/courses/:id/edit", controller.showEditCourse);
router.post("/courses/:id", controller.postEditCourse);
router.post("/courses/:id/delete", controller.postDeleteCourse);

// Session management
router.get("/courses/:id/sessions/new", controller.showAddSession);
router.post("/courses/:id/sessions", controller.postAddSession);
router.post("/sessions/:id/delete", controller.postDeleteSession);

// Class list
router.get("/courses/:id/classlist", controller.classListPage);

// User management
router.get("/users", controller.usersPage);
router.post("/users/:id/role", controller.postUpdateRole);
router.post("/users/:id/delete", controller.postDeleteUser);

export default router;