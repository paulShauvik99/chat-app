import WebSocket, { WebSocketServer } from "ws";
import { IncomingMessage, IncomingMessageType} from "./types";
import dotenv from 'dotenv'
import { createClient, RedisClientType } from "redis";
import prisma from "../index"
import { clear, timeStamp } from "console";

dotenv.config()

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"


// Creating Redis Client
const redisPub : RedisClientType = createClient({ url : redisUrl });
const redisSub : RedisClientType = createClient({ url : redisUrl });
const redisCache : RedisClientType = createClient({ url : redisUrl });


(async () => {
    await redisPub.connect();
    await redisSub.connect();
    await redisCache.connect();
    console.log("Connected to redis")
})()

const wss = new WebSocketServer( { port : Number(process.env.WS_PORT) || 5001 } )


const clientRooms = new Map<WebSocket, Set<string>>()

wss.on('connection' , function(ws : WebSocket){
    
    console.log("Client connected!")

    // Initializing the Client Rooms
    clientRooms.set(ws , new Set())

    ws.on('message', async (message : IncomingMessageType) => {
        
        const parsedData = IncomingMessage.safeParse(JSON.parse(message.toString()))

        // console.dir(parsedData, { depth : null})

        if(!parsedData.success){
            ws.send("Error:  "+ parsedData.error)
            return
        }


        await messageHandler(ws , parsedData.data)

    })


    ws.on("close", () => {
        console.log("Client Disconnected");
        clientRooms.delete(ws);
    });

})





const messageHandler  = async ( ws : WebSocket , {type , payload } : IncomingMessageType) => {
    console.log(type)
    console.log("-----------")
    console.log(payload)

    try {
        if( type === "INIT_CHAT"){
            const { roomIds } = payload;

            roomIds.forEach(roomId => {
                clientRooms.get(ws)?.add(roomId)
            })

            return
        }else if( type === "JOIN_CHAT"){
            const { roomId , senderId , chatId ,message, type } = payload;

            (ws as any).senderId = senderId;

            clientRooms.get(ws)?.add(roomId)


            //  Save in Redis Cache
            await redisCache.rPush(`roomId:${roomId}` , JSON.stringify({chatId , senderId , message , type , roomId , timeStamp : Date.now() }));
            
            await redisCache.rPush(`temp_roomId:${roomId}` , JSON.stringify({chatId , senderId , message , type , roomId , timeStamp : Date.now() }));

            // Publish the message to the channel
            redisPub.publish(`room:${roomId}` , JSON.stringify(payload))

            return
        }else if( type === "USER_LEAVE_GROUP"){
            
        }
        
    } catch (error) {
        console.error("Error while publishing message " + error)
    }

}


redisSub.pSubscribe("room:*", async (message , channel) =>{

    try {
        const roomId = channel.split(":")[1]
        const data = JSON.parse(message)
        const { senderId } = data

        wss.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN && clientRooms.get(client)?.has(roomId) && (client as any).senderId !== senderId){
                client.send(JSON.stringify(data))
            }
        })
    } catch (error) {
        console.error("Error while sending data back to Clients" + error)
    }
})



setInterval(async () => {
    console.log("Saving to DB")

    const roomKeys = await redisCache.keys("temp_roomId:*")

    for(const roomKey of roomKeys) {
        const roomId = roomKey.split(":")[1]

        try {
            
            const checkIfChatExists = await prisma.chat.findUnique({
                where : {
                    roomId : roomId,
                }
            })
            
            if(!checkIfChatExists) {
                console.error("Chat does not exist")
                return
            }
            
            const messages = await redisCache.lRange(roomKey , 0 , -1)
            console.log(messages)
            
            for(const msg of messages){
                const { senderId , message , timeStamp } = JSON.parse(msg)
                
                await prisma.message.create({
                    data : {
                        roomId : roomId,
                        senderId : senderId,
                        content : message,
                        timeStamp : timeStamp
                    }
                })
            }
            
            await redisCache.del(roomKey)

        } catch (error) {
            console.error("Error while Saving in DB" , error)
        }
    }

    console.log("Messages Saved to DB...")

}, 10000)