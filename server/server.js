const Reciever = require('../structures/Reciever'),
    HostServer = require('../structures/HostServer')
    config = require('./config.json'),
    Cryptography = require('../Utils/Cryptography'),
    storage = require('./storage.json');

const Server = new HostServer(config, storage);
Server.start();


function sendMessage(content, user) {    
    let m = Server.defaultChannel.send(content, user);    
    Server.transmitter.sendAllConnections(Server.activeConnections, {
        code: Server.transmitter.codes.dataMessage,
        data: m.safe()
    })
}
 

process.stdin.on('data', (chunk) => {
    chunk = chunk.toString().trim();
    let data = chunk.split(' ');
    let cmd = data.shift();

    switch (cmd) {
        case "add-role":
            let user = Server.chat.getUserByName(data[1]);
            if(user) user.role = config.roles[data[0]];
                
            
            break;
        default:
            break;
    }
})

Server.on('connection', (socket) => {
    Server.reciever = new Reciever(socket, config.server.serverPassword);
    for (let i = 0; i < config.banList.length; i++) {
        if(socket.remoteAddress == config.banList[i]) {
            socket.end();
            return
        };
    }
    

    const con = Server.addConnection(socket);
    Server.transmitter.send(socket, {
        code: Server.transmitter.codes.connectionSuccessful,
        data: {
            
        }
    });

    Server.reciever.on('debug', (code, data) => {
        process.stdout.write(code);
        console.log(data);
    })

    Server.reciever.on('connectionSuccessful', (data) => {
        con.ip = socket.remoteAddress;
        Server.transmitter.send(socket, {
            code: Server.transmitter.codes.loginRequest,
            data: {
                server: Server.chat.safe()
            }
        })
    })

    Server.reciever.on('loginRequest', (data) => {
        con.requests++;
        if(con.requests >= 5) return;
        if(data.nickname.trim().length > 20 || !con) return;
        if(config.server.passwordRequired) {
            if(Server.chat.getUserByName(data.nickname)) {
                con.user = Server.chat.getUserByName(data.nickname);
                if(Cryptography.compareHash(data.password, con.user.password)) {
                    con.channel = Server.chat.defaultChannel;
                    Server.chat.addUser(con.user);
                    Server.transmitter.send(socket, {
                        code: Server.transmitter.codes.loginSuccessful,
                        data: {
                            server: Server.chat.safe()
                        }
                    })
                } else {
                    Server.transmitter.send(socket, {
                        code: Server.transmitter.codes.connectionRefused,
                        data: {
                            
                        }
                    })
                    socket.end();
                }
            } else {
                let pass = Cryptography.generatePassword();
                con.user = Server.chat.createUser(data.nickname, pass)
    
                con.channel = Server.chat.defaultChannel;
        
                Server.transmitter.send(socket, {
                    code: Server.transmitter.codes.loginSuccessful,
                    data: {
                        server: Server.chat.safe(),
                        password: pass
                    }
                })
            }
        } else {
            let userExists = Server.chat.getUserByName(data.nickname);
            con.user = (userExists) ? userExists : Server.chat.createUser(data.nickname);

            con.channel = Server.chat.defaultChannel;
    
            Server.transmitter.send(socket, {
                code: Server.transmitter.codes.loginSuccessful,
                data: {
                    server: Server.chat.safe()
                }
            })
        }
    })

    Server.reciever.on('loginSuccessful', (data) => {
        con.requests++;
        if(con.requests >= 5) return;
        Server.chat.activeUsers.add(con.user);   
             
        try{sendMessage(`${con.user.name} has joined`, Server.chat.systemUser)}catch(e){}
    })
    
    Server.reciever.on('connectionRefused', (data) => {
        console.log(Server.chat.activeUsers);
        Server.chat.activeUsers.delete(con.user);
        console.log(Server.chat.activeUsers);
        try{sendMessage(`${con.user.name} has left`, Server.chat.systemUser)}catch(e){}
    })

    Server.reciever.on('dataMessage', (data) => {
        con.requests++;
        if(con.requests >= 5) return;

        data.content = Buffer.from(data.content).toString('ascii').trim()
        if(data.content.length > 250 || data.content.length < 1) return;
        sendMessage(String.raw`${data.content}`, con.user)
    })

    Server.reciever.on('requestData', (data) => {
        Server.transmitter.send(socket, {
            code: Server.transmitter.codes.dataInfo,
            data: Server.chat.safe()
        })
    })
})

Server.on('ftpConnection', () => {

})