// // enlever les balises:
// let newmessage = msg.message.replaceAll("<", "&lt;")
// newmessage = newmessage.replaceAll(">", "&gt;")

// // On stocke le message en base de donnée
// console.log(msg.cookie)
// console.log("Message reçu : " + msg.message)

// const message = Chat.create({
//     // name: msg.name,
//     // message: msg.message,
//     // room: msg.room,
//     // createdAt: msg.createdAt
// }).then(() => {
//     // le message est stocké, on le relaie a tous les utilisateurs dans le bon salon
//     //io.in(msg.room).emit("received_message", msg);
//     io.in(msg.room).emit("received_message", msg);
// }).catch(e => {
//     console.log(e);
// });