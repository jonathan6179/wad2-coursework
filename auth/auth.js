// auth/auth.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "../loadEnv.js";
import { UserModel } from "../models/userModel.js";

export const login = async (req, res, next) => {
    try {
        const email = req.body?.email;
        const password = req.body?.password;

        if (!email || !password) {
            return res.status(400).render("login", { title: "Sign in", error: "Please enter your email and password." });
        }

        const user = await UserModel.findByEmail(email);

        if (!user) {
            console.log("User", email, "not found");
            return res.render("register", { title: "Register", error: "No account found. Please register." });
        }

        if (!user.password || typeof user.password !== "string") {
            console.warn(`Malformed user record for ${email}`);
            return res.status(500).send("Internal Server Error");
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(403).render("login", { title: "Sign in", error: "Incorrect password." });
        }

        const secret = process.env.ACCESS_TOKEN_SECRET;

        if (!secret) {
            console.error("ACCESS_TOKEN_SECRET is not set");
            return res.status(500).send("Server misconfiguration");
        }

        // Include id and role in payload so controllers can use req.user._id and req.user.role
        const payload = { _id: user._id, email: user.email, name: user.name, role: user.role };
        const accessToken = jwt.sign(payload, secret, { expiresIn: 300 });

        res.cookie("jwt", accessToken, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 300 * 1000,
        });

        return next();

    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).send("Internal Server Error");
    }
};

// Verify: checks JWT cookie, attaches decoded payload to req.user
export const verify = (req, res, next) => {
    const accessToken = req.cookies?.jwt;

    if (!accessToken) {
        return res.redirect("/login");
    }

    try {
        const payload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        req.user = payload;
        return next();
    } catch (e) {
        return res.redirect("/login");
    }
};

// requireOrganiser: only allows users with role === "organiser"
export const requireOrganiser = (req, res, next) => {
    if (!req.user || req.user.role !== "organiser") {
        return res.status(403).render("error", { title: "Forbidden", message: "Organiser access required." });
    }
    return next();
};