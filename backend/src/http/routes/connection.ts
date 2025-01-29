import { Router } from "express";
import { userMiddleware } from "../middlewares/middleware";
import { v4 as uuidv4} from 'uuid'
import { CreateGroupSchema, FriendsSchema } from "../types";
import prisma from "../../index"

export const connectionRouter = Router()

connectionRouter.use(userMiddleware)


connectionRouter.post('/send_request', async (req, res) => {
    
    const data = req.body
    const parsedData = FriendsSchema.safeParse(data)

    if(!parsedData.success){
        return res.status(400).json({error : "Bad Request."})
    }

    try {
        const checkIfFriends = await prisma.friend.findFirst({
            where : {
                OR : [
                    { userId : parsedData.data?.userId , friendId : parsedData.data?.friendId },
                    { userId : parsedData.data?.friendId , friendId : parsedData.data?.userId}
                ]
            }
        })

        if(checkIfFriends){
            return res.status(409).json({error : "They are already Friends!"})
        }

        await prisma.$transaction([
            prisma.friend.create({
                data : {
                    userId : parsedData.data.userId,
                    friendId : parsedData.data.friendId,
                    status : parsedData.data.status!
                }
            }),
            prisma.friend.create({
                data : {
                    userId : parsedData.data.friendId,
                    friendId : parsedData.data.userId,
                    status : parsedData.data.status!
                }
            })
        ])

        return res.status(201).json({ success : "Friend Request Sent!"})

        
    } catch (error) {
        return res.status(500).json({ error : "Server Error : " +error})
    }
})


connectionRouter.patch('/accept_request', async (req, res) => {
    const data = req.body
    const parsedData = FriendsSchema.safeParse(data)

    if(!parsedData.success) {
        return res.status(401).json({error : "Bad Request"})
    }

    try {
        const data = await prisma.friend.findFirst({
            where : {
                OR : [
                    { userId : parsedData.data.userId, friendId : parsedData.data.friendId},
                    { userId : parsedData.data.friendId, friendId : parsedData.data.userId}
                ]
            }
        })

        if(!data){
            return res.status(401).json({ error : "Friends not found!"})
        }

        const roomId = uuidv4()


        await prisma.$transaction([
            prisma.friend.update({
                where : { 
                    userId_friendId : {
                        userId : parsedData.data.userId,
                        friendId : parsedData.data.friendId
                    }
                },
                data : {
                    status : parsedData.data.status!,
                    roomId : roomId
                }
            }),
            prisma.friend.update({
                where : {
                    userId_friendId : {
                        userId : parsedData.data.friendId,
                        friendId : parsedData.data.userId
                    }
                },
                data : {
                    status : parsedData.data.status!,
                    roomId : roomId
                }
            })
        ])


        return res.status(200).json({ success : "Friend Request Accepted"})

    } catch (error) {
        return res.status(500).json({ error : "Server Error : " + error })
    }

})


connectionRouter.patch('/reject_request', async (req, res) => {
    const data = req.body
    const parsedData = FriendsSchema.safeParse(data)

    if(!parsedData.success) {
        return res.status(401).json({error : "Bad Request"})
    }

    try {
        const data = await prisma.friend.findFirst({
            where : {
                OR : [
                    { userId : parsedData.data.userId, friendId : parsedData.data.friendId},
                    { userId : parsedData.data.friendId, friendId : parsedData.data.userId}
                ]
            }
        })

        if(!data){
            return res.status(401).json({ error : "Friends not found!"})
        }

        // const roomId = uuidv4()


        await prisma.$transaction([
            prisma.friend.update({
                where : { 
                    userId_friendId : {
                        userId : parsedData.data.userId,
                        friendId : parsedData.data.friendId
                    }
                },
                data : {
                    status : parsedData.data.status!,
                }
            }),
            prisma.friend.update({
                where : {
                    userId_friendId : {
                        userId : parsedData.data.friendId,
                        friendId : parsedData.data.userId
                    }
                },
                data : {
                    status : parsedData.data.status!,
                }
            })
        ])


        return res.status(200).json({ success : "Friend Request Rejected"})

    } catch (error) {
        return res.status(500).json({ error : "Server Error : " + error })
    }
})

connectionRouter.post('/create_group', async (req, res) => {

    const data = req.body
    const parsedData = CreateGroupSchema.safeParse(data)
    
    if(!parsedData.success) {
        return res.status(401).json({error : "Bad Request"})
    }

    try {

        const groupRoomId = uuidv4()

        await prisma.group.create({
            data : {
                groupName : parsedData.data.groupName,
                roomId : groupRoomId,
                members : {
                    create : parsedData.data.userIds.map((userId) => ({
                        user : {connect : { id : userId}}
                    }))
                }

            }
        })

        return res.status(201).json({success : "Group created successfully!"})

    } catch (error) {
        return res.status(500).json({error : "Server error :  " + error })   
    }
})



// -------------- Not Required as Start Chat will be handled by WS Server -------------
// connectionRouter.post('/start_chat', async (req, res) => {

// })

connectionRouter.delete('/remove_friend', async (req, res) => {
    const data = req.body
    const parsedData = FriendsSchema.safeParse(data)

    if(!parsedData.success) {
        return res.status(401).json({ error : "Bad Request"})
    }

    
    try {
        const friendship = await prisma.friend.findMany({
            where : {
                OR : [
                    {userId : parsedData.data.userId, friendId : parsedData.data.friendId},
                    {userId : parsedData.data.friendId , friendId : parsedData.data.userId}
                ]
            }
        })
    
        if(!friendship){
            return res.status(402).json({ error : "Friendship does not exist!"})
        }

        await prisma.friend.deleteMany({
            where : {
                OR : [
                    {userId : parsedData.data.userId, friendId : parsedData.data.friendId},
                    {userId : parsedData.data.friendId , friendId : parsedData.data.userId}
                ]
            }
        })

        return res.status(200).json({ success : "Friend Removed Successfully!"})
    } catch (error) {
        return res.status(500).json({ error : "Server Error :  " + error })
    }

})

connectionRouter.delete('/remove_group_user', async (req, res) => {
    
})  

