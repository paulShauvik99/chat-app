import { Request, Response, Router } from "express";
import { userMiddleware } from "../middlewares/middleware";
import prisma from '../../index'


export const userRouter = Router()



userRouter.use(userMiddleware) 

userRouter.get('/:id' , async (req : Request , res : Response) => {

    const { id } = req.params
    try {
        const user = await prisma.user.findUnique({
            where : { id : id },
            include : { friends : true , setting : true , chats : { include : { chat : { include : { messages : true }}} }}
        })
        
        if(!user){
            return res.status(404).json({ error : "User doesn't exits " })
        }
        
        const allUsers = await prisma.user.findMany()

        return res.status(200).json({ success : "All Users Fetched" , allUsers : allUsers , friendsOfUser : user?.friends, userChat : user?.chats  , user_settings : user?.setting})

    } catch (error) {
        return res.status(500).json({ error : "Server Error"+ error })
    }
})


userRouter.get('/user_info/:id' , async (req, res) => {

    const { id } = req.params
    try {
        const userInfo = await prisma.user.findUnique({
            where : { id: id },
        })

        if(!userInfo){
            return res.status(404).json({ error : "User doesn't exists" })
        }

        return res.status(200).json({success : "User Info Fetched" , userInfo : userInfo})

    } catch (error) {
        return res.status(500).json({ error : "Server Error : " + error })
    } 
})


// ------ Need to Update the Settings Model and Database ------------
userRouter.patch('/:id/settings_update' , async (req : Request , res : Response) => {
    const { id } = req.params
    const updatedSettings = req.body
    
    // await prisma.user.update({
    //     where : { id : id},
    //     data : { setting : { ...updatedSettings } }
    // })
    console.log(id )
    console.log(updatedSettings )

    return res.status(200).json({ success: updatedSettings })
})


