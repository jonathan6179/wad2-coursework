// controllers/organiserController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { UserModel } from "../models/userModel.js";

const fmtDate = (iso) =>
    iso
        ? new Date(iso).toLocaleString("en-GB", {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

// Dashboard — list all courses
export const dashboard = async (req, res, next) => {
    try {
        const courses = await CourseModel.list();
        res.render("organiser/dashboard", {
            title: "Organiser Dashboard",
            courses,
        });
    } catch (err) {
        next(err);
    }
};

// Show form to add a new course
export const showAddCourse = (req, res) => {
    res.render("organiser/course_form", {
        title: "Add New Course",
        course: {},
        action: "/organiser/courses",
        buttonLabel: "Add Course",
        isNew: true,
        levelBeginner: true,
        levelIntermediate: false,
        levelAdvanced: false,
        typeWeekly: true,
        typeWeekend: false,
    });
};

// Handle POST to add a new course
export const postAddCourse = async (req, res, next) => {
    try {
        const { title, description, level, type, allowDropIn, startDate, endDate, location, price } = req.body;
        await CourseModel.create({
            title,
            description,
            level,
            type,
            allowDropIn: allowDropIn === "on",
            startDate,
            endDate,
            location,
            price: parseFloat(price) || 0,
            sessionIds: [],
        });
        res.redirect("/organiser");
    } catch (err) {
        next(err);
    }
};

// Show form to edit an existing course
export const showEditCourse = async (req, res, next) => {
    try {
        const course = await CourseModel.findById(req.params.id);
        if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });
        res.render("organiser/course_form", {
            title: "Edit Course",
            course,
            action: `/organiser/courses/${course._id}`,
            buttonLabel: "Save Changes",
            levelBeginner: course.level === "beginner",
            levelIntermediate: course.level === "intermediate",
            levelAdvanced: course.level === "advanced",
            typeWeekly: course.type === "WEEKLY_BLOCK",
            typeWeekend: course.type === "WEEKEND_WORKSHOP",
        });
    } catch (err) {
        next(err);
    }
};

// Handle POST to update a course
export const postEditCourse = async (req, res, next) => {
    try {
        const { title, description, level, type, allowDropIn, startDate, endDate, location, price } = req.body;
        await CourseModel.update(req.params.id, {
            title,
            description,
            level,
            type,
            allowDropIn: allowDropIn === "on",
            startDate,
            endDate,
            location,
            price: parseFloat(price) || 0,
        });
        res.redirect("/organiser");
    } catch (err) {
        next(err);
    }
};

// Handle POST to delete a course and its sessions
export const postDeleteCourse = async (req, res, next) => {
    try {
        await SessionModel.removeByCourse(req.params.id);
        await CourseModel.remove(req.params.id);
        res.redirect("/organiser");
    } catch (err) {
        next(err);
    }
};

// Show form to add a session to a course
export const showAddSession = async (req, res, next) => {
    try {
        const course = await CourseModel.findById(req.params.id);
        if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });
        res.render("organiser/session_form", {
            title: "Add Session",
            course,
            session: {},
            action: `/organiser/courses/${course._id}/sessions`,
            buttonLabel: "Add Session",
        });
    } catch (err) {
        next(err);
    }
};

// Handle POST to add a session
export const postAddSession = async (req, res, next) => {
    try {
        const { startDateTime, endDateTime, capacity } = req.body;
        await SessionModel.create({
            courseId: req.params.id,
            startDateTime: new Date(startDateTime).toISOString(),
            endDateTime: new Date(endDateTime).toISOString(),
            capacity: parseInt(capacity) || 0,
            bookedCount: 0,
        });
        res.redirect("/organiser");
    } catch (err) {
        next(err);
    }
};

// Handle POST to delete a session
export const postDeleteSession = async (req, res, next) => {
    try {
        await SessionModel.remove(req.params.id);
        res.redirect("/organiser");
    } catch (err) {
        next(err);
    }
};

// Generate class list for a course
export const classListPage = async (req, res, next) => {
    try {
        const course = await CourseModel.findById(req.params.id);
        if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });

        const bookings = await BookingModel.listByCourse(req.params.id);
        const participants = await Promise.all(
            bookings.map(async (b) => {
                const user = await UserModel.findById(b.userId);
                return {
                    name: user ? user.name : "Unknown",
                    email: user ? user.email : "",
                    status: b.status,
                    createdAt: fmtDate(b.createdAt),
                };
            })
        );

        res.render("organiser/class_list", {
            title: `Class List — ${course.title}`,
            course,
            participants,
        });
    } catch (err) {
        next(err);
    }
};

// User management — list all users
export const usersPage = async (req, res, next) => {
    try {
        const allUsers = await UserModel.findAll();
        // Add boolean flags for role dropdown selected state
        const users = allUsers.map((u) => ({
            ...u,
            isStudent: u.role === "student",
            isOrganiser: u.role === "organiser",
            isInstructor: u.role === "instructor",
            isSelf: u._id === req.user._id,
        }));
        res.render("organiser/users", {
            title: "User Management",
            users,
        });
    } catch (err) {
        next(err);
    }
};

// Handle POST to update a user's role
export const postUpdateRole = async (req, res, next) => {
    try {
        // Prevent organiser from changing their own role
        if (req.params.id === req.user._id) {
            return res.status(403).render("error", {
                title: "Forbidden",
                message: "You cannot change your own role.",
            });
        }
        await UserModel.updateRole(req.params.id, req.body.role);
        res.redirect("/organiser/users");
    } catch (err) {
        next(err);
    }
};

// Handle POST to delete a user
export const postDeleteUser = async (req, res, next) => {
    try {
        // Prevent organiser from deleting themselves
        if (req.params.id === req.user._id) {
            return res.status(403).render("error", {
                title: "Forbidden",
                message: "You cannot delete your own account.",
            });
        }
        await UserModel.remove(req.params.id);
        res.redirect("/organiser/users");
    } catch (err) {
        next(err);
    }
};