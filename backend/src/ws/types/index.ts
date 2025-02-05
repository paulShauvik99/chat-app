import { userInfo } from 'os'
import z from 'zod'

export enum SupportedTypes {
    JoinChat = "JOIN_CHAT",
    UserLeaveGroup = "USER_LEAVE_GROUP",
    InitChat = "INIT_CHAT",
}


export const UserLeaveGroup = z.object({
    leaverId : z.string(),
    roomId : z.string(),
    groupId : z.string(),
})

export type UserLeaveGroupType = z.infer<typeof UserLeaveGroup>

export const JoinChat = z.object({
    senderId : z.string(),
    roomId : z.string(),
    chatId : z.string(),
    message : z.string(),
    type : z.enum(["DIRECT" , "GROUP"])
})

export type JoinChatType = z.infer<typeof JoinChat>

export const InitChat = z.object({
    roomIds : z.array(z.string())
})

export type InitChatType = z.infer<typeof InitChat>


export const IncomingMessage = z.discriminatedUnion("type" , [
    z.object({
        type : z.literal(SupportedTypes.UserLeaveGroup),
        payload : UserLeaveGroup
    }),
    z.object({
        type : z.literal(SupportedTypes.JoinChat),
        payload : JoinChat
    }),
    z.object({
        type : z.literal(SupportedTypes.InitChat),
        payload : InitChat
    })
])

export type IncomingMessageType = z.infer<typeof IncomingMessage>

