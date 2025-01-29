"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectionRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../middlewares/middleware");
const uuid_1 = require("uuid");
exports.connectionRouter = (0, express_1.Router)();
exports.connectionRouter.use(middleware_1.userMiddleware);
exports.connectionRouter.post('/send_request', async (req, res) => {
    const data = req.body;
    const roomId = (0, uuid_1.v4)();
    console.log(typeof roomId);
    console.log(roomId);
    // if()
});
exports.connectionRouter.post('/accept_request', async (req, res) => {
});
exports.connectionRouter.post('/create_group', async (req, res) => {
});
exports.connectionRouter.post('/start_chat', async (req, res) => {
});
exports.connectionRouter.delete('/remove_friend', async (req, res) => {
});
