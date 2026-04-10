// // index.js
// import express from "express";
// import cookieParser from "cookie-parser";
// import dotenv from "dotenv";
// import mustacheExpress from "mustache-express";
// import path from "path";
// import { fileURLToPath } from "url";

// // import authRoutes from "./routes/auth.js"; // (optional - if you already had this)
// import courseRoutes from "./routes/courses.js"; // JSON API
// import sessionRoutes from "./routes/sessions.js"; // JSON API
// import bookingRoutes from "./routes/bookings.js"; // JSON API
// import viewRoutes from "./routes/views.js"; // <-- NEW: SSR pages
// import { attachDemoUser } from "./middlewares/demoUser.js";

// import { initDb } from "./models/_db.js";
// await initDb();

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // View engine (Mustache)
// app.engine(
//   "mustache",
//   mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
// );
// app.set("view engine", "mustache");
// app.set("views", path.join(__dirname, "views"));

// // Body parsing for forms (no body-parser package)
// app.use(express.urlencoded({ extended: false }));
// app.use(express.json());
// app.use(cookieParser());

// // Static assets
// app.use("/static", express.static(path.join(__dirname, "public")));

// // Attach a demo user to req/res.locals so pages can show a logged-in user
// app.use(attachDemoUser);

// // Health
// app.get("/health", (req, res) => res.json({ ok: true }));

// // JSON API routes
// // app.use('/auth', authRoutes);
// app.use("/courses", courseRoutes);
// app.use("/sessions", sessionRoutes);
// app.use("/bookings", bookingRoutes);
// app.use("/views", viewRoutes);

// // 404 & 500
// export const not_found = (req, res) =>
//   res.status(404).type("text/plain").send("404 Not found.");
// export const server_error = (err, req, res, next) => {
//   console.error(err);
//   res.status(500).type("text/plain").send("Internal Server Error.");
// };
// app.use(not_found);
// app.use(server_error);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Yoga booking running`, `port ${PORT}`));

// index.js
import "./loadEnv.js";
import express from "express";
import cookieParser from "cookie-parser";
import mustacheExpress from "mustache-express";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";

import courseRoutes from "./routes/courses.js";
import sessionRoutes from "./routes/sessions.js";
import bookingRoutes from "./routes/bookings.js";
import viewRoutes from "./routes/views.js";
import userRoutes from "./routes/userRoutes.js";
import organiserRoutes from "./routes/organiserRoutes.js";
import { initDb } from "./models/_db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// View engine (Mustache)
app.engine(
    "mustache",
    mustacheExpress(path.join(__dirname, "views", "partials"), ".mustache")
);
app.set("view engine", "mustache");
app.set("views", path.join(__dirname, "views"));

// Body parsing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

// Static assets
app.use("/static", express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "node_modules/bootstrap/dist/css")));
app.use("/js", express.static(path.join(__dirname, "node_modules/bootstrap/dist/js")));

// Global middleware — silently reads JWT cookie on every request
app.use((req, res, next) => {
    const token = req.cookies?.jwt;
    if (token) {
        try {
            const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            payload.isOrganiser = payload.role === "organiser";
            res.locals.user = payload;
            req.user = payload;
        } catch (e) {
            res.locals.user = null;
        }
    }
    next();
});

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Routes
app.use("/", userRoutes);
app.use("/organiser", organiserRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/", viewRoutes);

// 404
app.use((req, res) => {
    res.status(404).type("text/plain").send("404 Not found.");
});

// 500
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).type("text/plain").send("Internal Server Error.");
});

// Only start the server outside tests
if (process.env.NODE_ENV !== "test") {
    await initDb();
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () =>
        console.log(`Yoga booking running on http://localhost:${PORT}`)
    );
}