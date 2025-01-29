import { NextFunction, Request, Response } from "express";
import jwt from  "jsonwebtoken"

export const userMiddleware = (req : Request, res : Response , next : NextFunction) =>{
    
    const token = req.headers["authorization"]?.split(" ");

    if(!token){
        return res.status(401).json({ error : "Unauthorized" });
    }

    try {
        const isValid = jwt.verify(token[1] , process.env.JWT_PASSWORD!) as { userId : string , email : string , name : string }
        if(!isValid) {
            return res.status(403).json({ error : "Unauthorized" });
        }

        next()
        
    } catch (error) {
        return res.status(403).json({ error : "Unauthorized" + error });
    }
}