const { Server, User, Connection } = require('./structures.js');
const net = require('net');

function localPrompt(query, callback) {
    process.stdout.write(query)
    process.stdin.once('data', (chunk) => {
        callback(chunk.toString().trim());
    })
}

class HostServer {
    constructor() {
        this.activeConnections = [];
        this.chat = new Server("Terradice's Server");
        localPrompt("Server name: ", (data) => {
            this.chat.name = data;
            this.chat.createChannel("general");
        })
    }

    isConnected(ip) {
        let r = false;
        this.activeConnections.forEach(con => {
            if(con.ip == ip) r = true;
        });
        return r;
    }

    addConnection(sock) {
        let con = new Connection(sock);
        if(this.isConnected(con.ip)) {
            //con.throwError(Error("Already connected"));
            //return;
        };

        this.activeConnections.push(con);
        sock.on('end', (data) => {
            this.activeConnections.splice(this.activeConnections.indexOf(con, 1))
            this.chat.removeUser(con.user);
        })

        return con;
    }
}

const server = new HostServer();
net.createServer((sock) => {
    let con = server.addConnection(sock);
    if(sock.destroyed) return;
    console.log(`${con.ip} logged in`)


    sock.write('\033[2J')
    sock.write(`Connecting to ${server.chat.name}\n`);
    con.promptLogin((username) => {
        con.user = new User(username);
        con.channel = server.chat.channels[0];
        server.chat.addUser(con.user);
        con.refreshDisplay(server.chat);

        sock.on('data', (data) => {
            con.channel.send(data.toString().trim(), con.user);
        })

        con.channel.on('message', (msg) => {
            if(sock.destroyed) return;
            con.refreshDisplay(server.chat);
        })

        con.channel.server.once('userJoin', (usr) => {
            con.channel.send(`${usr.name} has joined`, server.chat.systemUser);
        })

        con.channel.server.on('userLeave', (usr) => {
            if(sock.destroyed) return;
            con.channel.send(`${usr.name} has left`, server.chat.systemUser);
        })
    });

    sock.on('end', (data) => {
        console.log(`${con.ip} logged out`)
    })
    
}).listen(3000, process.env.host)