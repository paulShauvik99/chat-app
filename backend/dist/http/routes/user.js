"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const middleware_1 = require("../middlewares/middleware");
const index_1 = __importDefault(require("../../index"));
exports.userRouter = (0, express_1.Router)();
exports.userRouter.use(middleware_1.userMiddleware);
exports.userRouter.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const allUsers = await index_1.default.user.findMany();
        const user = await index_1.default.user.findUnique({
            where: { id: id },
            include: { friends: true, setting: true, chats: { include: { chat: true } } }
        });
        return res.status(200).json({ success: "All Users Fetched", allUsers: allUsers, friendsOfUser: user?.friends, userChat: user?.chats, user_settings: user?.setting });
    }
    catch (error) {
        return res.status(500).json({ error: "Server Error" + error });
    }
});
// ------ Need to Update the Settings Model and Database ------------
exports.userRouter.patch('/:id/settings_update', async (req, res) => {
    const { id } = req.params;
    const updatedSettings = req.body;
    // await prisma.user.update({
    //     where : { id : id},
    //     data : { setting : { ...updatedSettings } }
    // })
    console.log(id);
    console.log(updatedSettings);
    return res.status(200).json({ success: updatedSettings });
});
