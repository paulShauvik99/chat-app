import { Router } from "express";
import { userMiddleware } from "../middlewares/middleware";
import { v4 as uuidv4} from 'uuid'
import { CreateGroupSchema, DBNewChatType, FriendsSchema, RemoveGroupUser } from "../types";
import prisma from "../../index"

export const connectionRouter = Router()

connectionRouter.use(userMiddleware)


// Initializing the Chat
const createChat = async ({userIds , roomId , type} : DBNewChatType) =>{

    const checkIfExists = await prisma.chat.findUnique({
        where : {
            roomId : roomId
        }
    })

    if(checkIfExists){
        return "Error"
    }

    try {
        
        const newChat = await prisma.chat.create({
            data : {
                roomId : roomId,
                type : type,
                users : {
                    create : userIds.map((userId) => ({ 
                        user : {connect : {id : userId } } 
                    }))
                }
            }
        })
        
        return newChat
    } catch (error) {
        console.error
    }
}



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

        const newChat = await createChat( {userIds : [parsedData.data.userId , parsedData.data.friendId]  , roomId : roomId ,  type : "DIRECT" } );

        if(newChat === "Error"){
            return res.status(402).json({ error : "Chat Exists!"})
        }


        return res.status(200).json({ success : "Friend Request Accepted", chatId : newChat!.id})

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
        

        const newGroupChat = await createChat( { userIds : parsedData.data.userIds , roomId : groupRoomId , type : "GROUP"} );
        if(newGroupChat === "Error") return res.status(402).json({error : "Chat already exists!"})

        return res.status(201).json({success : "Group created successfully!" , groupChatId : newGroupChat!.id })
        
    } catch (error) {
        return res.status(500).json({error : "Server error :  " + error })   
    }
})


connectionRouter.get('/group_info/:id' , async (req, res) => {

    const { id } = req.params
    try {
        const group = await prisma.group.findUnique({
            where : { id : id },
            include : {
                members : {
                    select : {
                        user : {
                            select : {
                                name : true,
                                email : true,
                                phone : true
                            }
                        }
                    }
                }
            }
        })

        if(!group) {
            return res.status(404).json({ error : "Group Not Found!"})
        }

        return res.status(200).json({success : "Group Details Fetched" , members : group.members   })


    } catch (error) {
        return res.status(500).json({error : "server error : " + error })
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
    const data = req.body
    const parsedData = RemoveGroupUser.safeParse(data)

    if(!parsedData.success) {
        return res.status(401).json({ error : "Bad Request"})
    }

    try {
        const checkIfUserExists = await prisma.groupUser.findUnique({
            where : {
                userId_groupId : {
                    userId : parsedData.data.userId,
                    groupId : parsedData.data.groupId
                }
            }
        })

        if(!checkIfUserExists){
            return res.status(401).json({ error : "User Does Not Belongs To The Group"})
        }

        await prisma.groupUser.delete({
            where : {
                userId_groupId : {
                    userId : parsedData.data.userId,
                    groupId : parsedData.data.groupId
                }
            }
        })

        return res.status(200).json({success : "User Removed Successfully"})

    } catch (error) {
        return res.status(500).json({error : "Server Error : " + error})
    }

})  
