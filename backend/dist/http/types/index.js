"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignupSchema = exports.SigninSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.SigninSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string()
});
exports.SignupSchema = zod_1.default.object({
    name: zod_1.default.string(),
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
    phone: zod_1.default.string().max(10).min(10),
    dob: zod_1.default.date().optional(),
    profilePic: zod_1.default.string().optional(),
});
