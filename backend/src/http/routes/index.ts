import { NextFunction, Request, Response, Router } from "express";
import { userRouter } from "./user";
import { connectionRouter } from "./connection";
import { SigninSchema, SignupSchema } from "../types";
import prisma from "../../index";
import jwt from "jsonwebtoken";
import multer, { Multer } from "multer";
const bcrypt = require("bcrypt")
import path from "path";

export const router = Router()


const storage = multer.diskStorage({
    destination: "uploads/user_profile", // Directory to store files
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname); // Get original file extension
        cb(null, req.body.name+ "-" + Date.now() + ext); // Save with extension
    },
});

const fileFilter = (req: Request, file : Express.Multer.File, cb : multer.FileFilterCallback) => {
    // const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); 
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only Images are allowed!"));
    }
};

const upload = multer({storage , fileFilter})


router.post('/signin' , async (req: Request, res: Response) => {
    const parsedData  = SigninSchema.safeParse(req.body);
    if(!parsedData.success){
        return res.status(400).json({ error : "Bad Request"})
    }

    try {
        const user = await prisma.user.findUnique({
            where : { email : parsedData.data.email }
        })

        if(!user){
            return res.status(401).json({ error : "User not found!" })
        }

        const isValid = bcrypt.compare(parsedData.data.password , user.password)
        if(!isValid){
            return res.status(403).json({error : "Invalid Password"})
        }

        const token = jwt.sign({
            userId : user.id,
            email : user.email,
            name : user.name
        }, process.env.JWT_PASSWORD!)

        return res.status(200).json({success : "Successfully Logged In" , token : token})

    } catch (error) {
        return res.status(500).json({error : error})
    }

})


router.post('/signup', upload.single("profilePic") ,async (req : Request , res : Response) => {
    
    
    const parsedData = SignupSchema.safeParse(req.body)
    const file = req.file
    
    if(!parsedData.success || !file){
        return  res.status(400).json({error : "Bad Request"})

    }
    
    const hashPassword = bcrypt.hashSync(parsedData.data.password , 12)
    try {
        const newUser = await prisma.user.create({
            data : {
                email : parsedData.data.email,
                name : parsedData.data.name,
                password : hashPassword,
                phone : Number(parsedData.data.phone),
                profilePic : parsedData.data.profilePic
            }
        })
        
        const token = jwt.sign({
            userId : newUser.id,
            email : newUser.email,
            name : newUser.name
        }, process.env.JWT_PASSWORD!)
        
        return res.status(201).json({success : "User Created" , token : token })
    } catch (error) {
        return res.status(402).json({error : "User Exists" + error })
    }

})

//For catching Unsupported Error
router.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error:  "File not Supported : "  + err.message}); // ⬅️ Return JSON error response
    }
    return res.status(500).json({ error: "Internal Server Error" });
});



router.use('/user', userRouter)
router.use('/connection', connectionRouter)