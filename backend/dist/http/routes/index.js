"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const user_1 = require("./user");
const connection_1 = require("./connection");
const types_1 = require("../types");
const index_1 = __importDefault(require("../../index"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const multer_1 = __importDefault(require("multer"));
const bcrypt = require("bcrypt");
const path_1 = __importDefault(require("path"));
exports.router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: "uploads/user_profile", // Directory to store files
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname); // Get original file extension
        cb(null, req.body.name + "-" + Date.now() + ext); // Save with extension
    },
});
const fileFilter = (req, file, cb) => {
    // const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new multer_1.default.MulterError("LIMIT_UNEXPECTED_FILE", "Only Images are allowed!"));
    }
};
const upload = (0, multer_1.default)({ storage, fileFilter });
exports.router.post('/signin', async (req, res) => {
    const parsedData = types_1.SigninSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ error: "Bad Request" });
    }
    try {
        const user = await index_1.default.user.findUnique({
            where: { email: parsedData.data.email }
        });
        if (!user) {
            return res.status(401).json({ error: "User not found!" });
        }
        const isValid = bcrypt.compare(parsedData.data.password, user.password);
        if (!isValid) {
            return res.status(403).json({ error: "Invalid Password" });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            email: user.email,
            name: user.name
        }, process.env.JWT_PASSWORD);
        return res.status(200).json({ success: "Successfully Logged In", token: token });
    }
    catch (error) {
        return res.status(500).json({ error: error });
    }
});
exports.router.post('/signup', upload.single("profilePic"), async (req, res) => {
    const parsedData = types_1.SignupSchema.safeParse(req.body);
    const file = req.file;
    if (!parsedData.success || !file) {
        return res.status(400).json({ error: "Bad Request" });
    }
    const hashPassword = bcrypt.hashSync(parsedData.data.password, 12);
    try {
        const newUser = await index_1.default.user.create({
            data: {
                email: parsedData.data.email,
                name: parsedData.data.name,
                password: hashPassword,
                phone: Number(parsedData.data.phone),
                profilePic: parsedData.data.profilePic
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: newUser.id,
            email: newUser.email,
            name: newUser.name
        }, process.env.JWT_PASSWORD);
        return res.status(201).json({ success: "User Created", token: token });
    }
    catch (error) {
        return res.status(402).json({ error: "User Exists" + error });
    }
});
//For catching Unsupported Error
exports.router.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        return res.status(400).json({ error: "File not Supported : " + err.message }); // ⬅️ Return JSON error response
    }
    return res.status(500).json({ error: "Internal Server Error" });
});
exports.router.use('/user', user_1.userRouter);
exports.router.use('/connection', connection_1.connectionRouter);
