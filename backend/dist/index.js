"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
exports.default = new client_1.PrismaClient();
const prisma = new client_1.PrismaClient();
console.log(process.env.HTTP_PORT);
async function createUsers({ email, name, password, phone }) {
    var res = await prisma.user.create({
        data: {
            email: email,
            name: name,
            password: password,
            phone: phone,
        }
    });
    return res;
}
async function addFriend({ userId, friendId, roomId, status }) {
    try {
        const checkIfFriends = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId: userId, friendId: friendId },
                    { userId: friendId, friendId: userId },
                ]
            }
        });
        if (checkIfFriends) {
            console.log("They are friends");
            return;
        }
        const [friendship1, friendship2] = await prisma.$transaction([
            prisma.friend.create({
                data: {
                    userId: userId,
                    friendId: friendId,
                    roomId: roomId,
                    status: status
                }
            }),
            prisma.friend.create({
                data: {
                    userId: friendId,
                    friendId: userId,
                    roomId: roomId,
                    status: status
                }
            })
        ]);
        console.log("Friends created");
        return { friendship1: friendship1, friendship2: friendship2 };
    }
    catch (error) {
        console.error(error);
    }
}
async function getUserDetails(userId) {
    const userdet = await prisma.user.findFirst({
        where: { id: userId },
        // include : {friends : true, friendsOf : true}
        // include : {friends :{ include : { friend : true} } , friendsOf : { include : { user : true} }, groups : true}
        // include : {groups : { include : { group : {include : {members : true}} }}}
        include: { chats: { include: { chat: { include: { messages: true } } } } }
    });
    return userdet;
}
async function createGroup({ userId: userIds, groupName: grpname, roomId: roomId }) {
    const newGroup = await prisma.group.create({
        data: {
            groupName: grpname,
            roomId: roomId,
            members: {
                create: userIds.map(userId => ({
                    user: { connect: { id: userId } }
                }))
            }
        },
        include: { members: true }
    });
    return newGroup;
}
async function startChat({ userIds: userIds, senderId: senderId, roomId: roomId, type: type, content: content }) {
    const newChat = await prisma.chat.create({
        data: {
            roomId: roomId,
            type: type,
            users: {
                create: userIds.map(userId => ({
                    user: { connect: { id: userId } }
                }))
            },
            messages: {
                create: {
                    roomId: roomId,
                    senderId: senderId,
                    content: content
                }
            }
        }
    });
    return newChat;
}
async function updateChatMessage({ chatId: chatId, senderId: senderId, content: content }) {
    const checkIfExists = await prisma.chat.findUnique({
        where: { id: chatId }
    });
    if (!checkIfExists)
        return;
    const newMessage = await prisma.message.create({
        data: {
            chatId: chatId,
            roomId: checkIfExists.roomId,
            senderId: senderId,
            content: content
        }
    });
    return newMessage;
}
async function main() {
    // const user1 = await createUsers({email : "abc@example.com" ,name : "Abc Xy" ,password : "12345",phone : 9087654321})
    // const user2 = await createUsers({email : "bca@example.com" ,name : "Bca Xy" ,password : "12345",phone : 8097654321})
    // const user3 = await createUsers({email : "cab@example.com" ,name : "Cab Xx" ,password : "12345",phone : 7098654321})
    // var res = await addFriend({userId : user1.id, friendId :  user2.id, roomId : 'abcdefg12345' , status : 'ACCEPTED'})
    // var res2 = await addFriend({userId : user1.id, friendId :  user3.id, roomId : 'abcdefg12345' , status : 'ACCEPTED'})
    // console.log(res)
    // console.log(res2)
    var res3 = await getUserDetails('00fd6be3-c77b-4e1d-ac2e-5188b4e2489f');
    var res4 = await getUserDetails('0725e9a2-05e4-46dd-9522-66e458f09d9c');
    var res5 = await getUserDetails('ac8e6e21-bb96-4d2f-8835-aa35c40cf03a');
    // var group1 =  await createGroup({ userId: [res3!.id , res4!.id , res5!.id] , groupName : 'Grp of 3' , roomId : 'room-123' })
    // var group2 =  await createGroup({ userId: [res3!.id , res4!.id ] , groupName : 'Grp of 2' , roomId : 'room-12' })
    // var group3 =  await createGroup({ userId: [res4!.id , res5!.id ] , groupName : 'Grp of 2 bc' , roomId : 'room-23' })
    // console.log(JSON.stringify(group1,null, 2));
    // console.log("---------------------------")
    // console.log(JSON.stringify(group2,null, 2));
    // console.log("---------------------------")
    // console.log(JSON.stringify(group3,null, 2));
    // console.log("---------------------------")
    // var startchat = await startChat({userIds : [res3!.id , res4!.id, res5!.id] , roomId : 'room-123' , senderId : res5!.id , content : "Hello Guys, This is another Chat", type : "GROUP"})
    // var startChat = await prisma.chat.findUnique({
    //     where : { roomId : 'room-12' },
    //     include : {
    //         // users : true,
    //         messages : true
    //     }
    // })
    // var newchat = await updateChatMessage({ chatId : startChat!.id ,senderId : res3!.id ,content : "Hi Res4 "})
    // var res3 = await getUserDetails('00fd6be3-c77b-4e1d-ac2e-5188b4e2489f')
    // var res4 = await getUserDetails('0725e9a2-05e4-46dd-9522-66e458f09d9c')
    // var res5 = await getUserDetails('ac8e6e21-bb96-4d2f-8835-aa35c40cf03a')
    // // console.log(JSON.stringify(startchat1.chat1,null,2))
    // console.log("---------------------------")
    // console.log(JSON.stringify(startchat,null,2))
    console.log("---------------------------");
    console.log(JSON.stringify(res3, null, 2));
    console.log("---------------------------");
    console.log(JSON.stringify(res4, null, 2));
    console.log("---------------------------");
    console.log(JSON.stringify(res5, null, 2));
    console.log("---------------------------");
}
// main()
