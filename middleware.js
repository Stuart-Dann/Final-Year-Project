import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY; // Replace with a secure key

export function authenticateToken(req, res, next) {
    const token = req.cookies.authToken;

    if (!token) return res.status(401).json({ message: "Unauthorized" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Forbidden" });
        req.user = user;
        next();
    });
}

export function checkPermsissions(req, res, next) {
    const user = req.user;
    const requiredRole = "admin";

    if (user.role !== requiredRole) {
        return res.status(403).json({ message: "Forbidden" });
    }
    next();
}