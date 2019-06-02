const User = require('../structures/User'),
    Reciever = require('../structures/Reciever'),
    HostServer = require('../structures/HostServer')
    config = require('./config.json');

const hostServer = new HostServer(config);
hostServer.on('connection', (ws) => {
    hostServer.reciever = new Reciever(ws, true);

    const con = hostServer.addConnection(ws);
    hostServer.transmitter.send(ws, {
        code: hostServer.transmitter.codes.connectionSuccessful,
        data: {
            ip: ws.remoteAddress
        }
    });

    hostServer.reciever.on('connectionSuccessful', (data) => {
        hostServer.ip = data.ip;
        hostServer.transmitter.send(ws, {
            code: hostServer.transmitter.codes.loginRequest,
            data: {
                server: hostServer.chat.safe()
            }
        })
    })

    hostServer.reciever.on('loginRequest', (data) => {
        con.user = new User(data.nickname);
        con.ip = data.ip;
        con.channel = hostServer.chat.channels[0];
        hostServer.chat.addUser(con.user);

        hostServer.transmitter.send(ws, {
            code: hostServer.transmitter.codes.loginSuccessful,
            data: {
                ip: hostServer.ip,
                server: hostServer.chat.safe()
            }
        })
    })

    hostServer.reciever.on('loginSuccessful', (data) => {
        con.channel.send(`${con.user.name} has joined`, hostServer.chat.systemUser);
        hostServer.transmitter.sendAllConnections(hostServer.activeConnections, {
            code: hostServer.transmitter.codes.dataMessage,
            data: {
                author: hostServer.chat.systemUser.name,
                content: `${con.user.name} has joined`
            }
        })
    })
    
    hostServer.reciever.on('connectionRefused', (data) => {
        con.channel.send(`${con.user.name} has left`, hostServer.chat.systemUser);
        hostServer.transmitter.sendAllConnections(hostServer.activeConnections, {
            code: hostServer.transmitter.codes.dataMessage,
            data: {
                author: hostServer.chat.systemUser.name,
                content: `${con.user.name} has left`
            }
        })
    })

    hostServer.reciever.on('dataMessage', (data) => {
        con.channel.send(Buffer.from(data.content).toString('ascii').trim(), con.user);
        hostServer.transmitter.sendAllConnections(hostServer.activeConnections, {
            code: hostServer.transmitter.codes.dataMessage,
            data: {
                author: con.user.name,
                content: Buffer.from(data.content).toString('ascii').trim()
            }
        })
    })
})