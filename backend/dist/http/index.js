"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const routes_1 = require("./routes");
const dotenv_1 = __importDefault(require("dotenv"));
//Setting dotenv as it was not reading the .env file from the root directory
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/api/v1', routes_1.router);
app.use('/uploads', express_1.default.static('uploads'));
app.listen(process.env.HTTP_PORT || 5000, () => {
    console.log("listening on port " + process.env.HTTP_PORT);
});
