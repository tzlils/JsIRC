const User = require('./structures/User'),
    Reciever = require('./structures/Reciever'),
    HostServer = require('./structures/HostServer');

const hostServer = new HostServer();
hostServer.on('connection', (ws) => {
    hostServer.reciever = new Reciever(ws);

    let con = hostServer.addConnection(ws);
    hostServer.transmitter.send(ws, {
        code: hostServer.transmitter.codes.connectionSuccessful,
        data: {
            ip: hostServer.ip
        }
    });

    hostServer.reciever.on('connectionSuccessful', (data) => {
        hostServer.transmitter.send(ws, {
            code: hostServer.transmitter.codes.loginRequest,
            data: {
                server: hostServer.chat.safe()
            }
        })
    })

    hostServer.reciever.on('loginRequest', (data) => {
        con.user = new User(data.nickname);
        con.channel = hostServer.chat.channels[0];
        hostServer.chat.addUser(con.user);

        hostServer.transmitter.send(ws, {
            code: hostServer.transmitter.codes.loginSuccessful,
            data: {
                server: hostServer.chat.safe()
            }
        })
    })

    hostServer.reciever.on('loginSuccessful', (data) => {
        con.channel.send(`${con.user.name} has joined`, hostServer.chat.systemUser);
    })
    
    hostServer.reciever.on('connectionRefused', (data) => {
        //console.log(`${con.user.name}(${con.ip}) logged out`);
        con.channel.send(`${con.user.name} has left`, hostServer.chat.systemUser);
    })

    hostServer.reciever.on('dataMessage', (data) => {
        //console.log(`${data.author} Sent message: ${data.content}`);
        con.channel.send(data.toString().trim(), con.user);
        hostServer.transmitter.sendAllConnections(hostServer.activeConnections, {
            code: hostServer.transmitter.codes.dataMessage,
            data: {
                author: con.user.name,
                content: data.content
            }
        })
    })
})