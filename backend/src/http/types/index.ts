import z from 'zod'


export const SigninSchema = z.object({
    email : z.string().email(),
    password : z.string()
})

export type SigninType = z.infer<typeof SigninSchema>

export const SignupSchema = z.object({
    name : z.string(),
    email : z.string().email(),
    password : z.string(),
    phone : z.string().max(10).min(10),
    dob : z.date().optional(),
    profilePic : z.string().optional(),
})

export type SignupType = z.infer<typeof SignupSchema>

export const FriendsSchema = z.object({
    userId : z.string() , 
    friendId : z.string() ,
    status : z.enum(["ACCEPTED" , "REJECTED" , "PENDING_REQUEST"]).optional()
})

export type FriendsType = z.infer<typeof FriendsSchema>

export const CreateGroupSchema = z.object({
    userIds : z.array(z.string()),
    groupName : z.string()
})

export type CreateGroupType = z.infer<typeof CreateGroupSchema>

export const StartChatSchema = z.object({
    userIds : z.array(z.string()),
    roomId : z.string(),
    senderId : z.string(),
    type : z.enum([ "DIRECT" , "GROUP"]),
    content : z.string()
})

export type StartChatType = z.infer<typeof StartChatSchema>
