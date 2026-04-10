// routes/views.js
import { Router } from "express";
import { verify } from "../auth/auth.js";
import * as controller from "../controllers/viewsController.js";
import * as coursesListController from "../controllers/coursesListController.js";

const router = Router();

router.get("/", controller.homePage);
router.get("/about", controller.aboutPage);
router.get("/courses", coursesListController.coursesListPage);
router.get("/courses/:id", controller.courseDetailPage);
router.post("/courses/:id/book", verify, controller.postBookCourse);
router.post("/sessions/:id/book", verify, controller.postBookSession);
router.get("/bookings/:bookingId", controller.bookingConfirmationPage);

export default router;