const User = require('../structures/User'),
    Reciever = require('../structures/Reciever'),
    HostServer = require('../structures/HostServer')
    config = require('./config.json');

const hostServer = new HostServer(config);
function sendMessage(content, author) {
    try {
        hostServer.defaultChannel.send(content, author);
        hostServer.transmitter.sendAllConnections(hostServer.activeConnections, {
            code: hostServer.transmitter.codes.dataMessage,
            data: {
                author: author.name,
                content: content
            }
        })
    } catch (e) {}
}

hostServer.on('connection', (ws, req) => {
    hostServer.reciever = new Reciever(ws, true);
    for (let i = 0; i < config.banList.length; i++) {
        if(req.remoteAddress == config.banList[i]) {
            ws.socket.end();
            return
        };
    }
    

    const con = hostServer.addConnection(ws);
    hostServer.transmitter.send(ws, {
        code: hostServer.transmitter.codes.connectionSuccessful,
        data: {
            ip: req.remoteAddress
        }
    });

    hostServer.reciever.on('connectionSuccessful', (data) => {
        con.ip = req.remoteAddress;
        hostServer.transmitter.send(ws, {
            code: hostServer.transmitter.codes.loginRequest,
            data: {
                server: hostServer.chat.safe()
            }
        })
    })

    hostServer.reciever.on('loginRequest', (data) => {
        con.requests++;
        if(con.requests >= 5) return;
        if(data.nickname.trim().length > 20 || !con) return;
        con.user = new User(data.nickname);
        con.channel = hostServer.chat.channels[0];
        hostServer.chat.addUser(con.user);

        hostServer.ip = data.ip
        hostServer.transmitter.send(ws, {
            code: hostServer.transmitter.codes.loginSuccessful,
            data: {
                ip: hostServer.ip,
                server: hostServer.chat.safe()
            }
        })
    })

    hostServer.reciever.on('loginSuccessful', (data) => {
        con.requests++;
        if(con.requests >= 5) return;
        try {
            sendMessage(`${con.user.name} has joined`, hostServer.chat.systemUser)
        } catch (e) {}
    })
    
    hostServer.reciever.on('connectionRefused', (data) => {
        try { sendMessage(`${con.user.name} has left`, hostServer.chat.systemUser)
        } catch (e) {}
    })

    hostServer.reciever.on('dataMessage', (data) => {
        con.requests++;
        if(con.requests >= 5) return;

        data.content = Buffer.from(data.content).toString('ascii').trim()
        if(data.content.length > 250 || data.content.length < 1) return;
        sendMessage(data.content, con.user)
    })
})