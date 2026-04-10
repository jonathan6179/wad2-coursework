// controllers/userController.js
import { UserModel } from "../models/userModel.js";

export const showLogin = (req, res) => {
    res.render("login", { title: "Sign in" });
};

export const handleLogin = (req, res) => {
    // auth/auth.js login middleware has already verified credentials
    // and set the cookie — just redirect to home
    res.redirect("/");
};

export const showRegister = (req, res) => {
    res.render("register", { title: "Register" });
};

export const handleRegister = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).render("register", {
            title: "Register",
            error: "Please fill in all fields.",
        });
    }

    try {
        const existing = await UserModel.findByEmail(email);
        if (existing) {
            return res.status(400).render("register", {
                title: "Register",
                error: "An account with that email already exists.",
            });
        }

        await UserModel.create({ name, email, password, role: "student" });
        console.log("Registered user:", email);
        res.redirect("/login");
    } catch (err) {
        console.error("Error creating user:", err);
        res.status(500).send("Internal Server Error");
    }
};

export const logout = (req, res) => {
    res.clearCookie("jwt")
        .status(200)
        .redirect("/");
};