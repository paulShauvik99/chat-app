"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userMiddleware = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ");
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        const isValid = jsonwebtoken_1.default.verify(token[1], process.env.JWT_PASSWORD);
        if (!isValid) {
            return res.status(403).json({ error: "Unauthorized" });
        }
        next();
    }
    catch (error) {
        return res.status(403).json({ error: "Unauthorized" + error });
    }
};
exports.userMiddleware = userMiddleware;
