const EventEmitter = require('events');
const net = require('net');
class Object extends EventEmitter {
    constructor() {
        super();
        this.id = "";
        this.createdAt = new Date();
    }
}

class Server extends Object {
    constructor(name) {
        super();
        this.name = name;
        this.channels = [];
        this.users = [];
        this.systemUser = new User("System");
    }

    createChannel(name) {
        let c = new Channel(name, this);
        this.channels.push(c);
        return c;
    }
    
    addUser(user) {
        this.users.push(user);
        this.emit('userJoin', user);
    }

    removeUser(user) {
        this.users.splice(this.users.indexOf(user, 1));
        this.emit('userLeave', user);
    }

    safe() {
        let safeObj = {
            name: this.name,
            channels: [],
            users: this.users
        }
        this.channels.forEach(ch => {
            safeObj.channels.push(ch.safe());
        });
        return safeObj;
    }
}

class User {
    constructor(name) {
        this.id = "";
        this.createdAt = new Date();
        this.name = name;
    }
}

class Connection {
    constructor(sock) {
        this.ip = sock.remoteAddress;
        this.sock = sock;
        this.channel;
        this.user;
    }

    promptLogin(callback) {
        this.prompt("Username: ", (username) => {
            callback(username.toString().trim());
        });
    }

    prompt(query, callback) {
        //this.sock.write(query)
        this.sock.once('data', (d)=>{callback(d)});
    }

    throwError(error) {
        this.sock.end(error.toString());
        this.sock.destroy();
    }

    sendData(chat) {
        /*
        * Only send essential information and get rid of circulars
        * Only send latest message
        */
        //JSON.stringify(safeObj)
    }
}

class Channel extends Object {
    constructor(name, server) {
        super();
        this.name = name;
        this.server = server;
        this.messages = [];
    }

    send(content, user) {
        let m = new Message(this, this.server, user, content);
        //if(this.server.users.indexOf(user)) throw new Error("User is not in server!");
        this.messages.push(m);
        this.emit('message', m)
    }

    safe() {
        /*            lastmsg: {
                content: (ch.messages[ch.messages.length-1]) ? ch.messages[ch.messages.length-1].content : undefined,
                author: (ch.messages[ch.messages.length-1]) ? ch.messages[ch.messages.length-1].author : undefined
            },*/
        let safeObj = {
            server: {
                name: this.server.name
            },
            messages: [],
            name: this.name
        }

        this.messages.forEach(msg => {
            safeObj.messages.push(msg.safe());
        });
        return safeObj
    }
}

class Message {
    constructor(channel, server, author, content) {
        this.id = "";
        this.createdAt = new Date();
        this.channel = channel;
        this.server = server;
        this.author = author;
        this.content = content;
    }

    safe() {
        let safeObj = {
            content: this.content,
            author: this.author
        }
        return safeObj;
    }
}

class HostServer extends EventEmitter {
    constructor(server) {
        super();
        this.server = net.createServer((sock) => {
            this.emit('connection', sock);
        });
        this.activeConnections = [];
        this.transmitter = new Transmitter();
        this.ip = process.env.host;


        this.chat = new Server(process.argv0);
        this.chat.createChannel("general");
        this.server.listen(3000, this.ip);
    }

    /*localPrompt(query, callback) {
        process.stdout.write(query)
        process.stdin.once('data', (chunk) => {
            callback(chunk.toString().trim());
        })
    }*/

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

class Transmitter {
    constructor() {
        this.codes = {
            connectionSuccessful: '01',
            connectionRefused: '02',
            requestSuccessful: '03',
            requestRefused: '04',
            responseSuccess: '05',
            responseRefused: '06',
            loginSuccessful: '07',
            loginRequest: '08',
            dataMessage: '09',
            dataInfo: '10',
            dataDebug: '11'
        }
    }

    send(socket, content) {
        let format = `${content.code} ${Buffer.from(JSON.stringify(content.data)).toString('base64')}`;
        socket.write(format);
    }

    sendAllConnections(connections, content) {
        connections.forEach(connection => {
            let format = `${content.code} ${Buffer.from(JSON.stringify(content.data)).toString('base64')}`;
            connection.sock.write(format);  
        });
    }
}

class Reciever extends EventEmitter {
    constructor(client) {
        super();
        this.codes = {
            '01': 'connectionSuccessful',
            '02': 'connectionRefused',
            '03': 'requestSuccessful',
            '04': 'requestRefused',
            '05': 'responseSuccess',
            '06': 'responseRefused',
            '07': 'loginSuccessful',
            '08': 'loginRequest',
            '09': 'dataMessage',
            '10': 'dataInfo',
            '11': 'dataDebug'
        }
        client.on('data', (data) => {
            this.parse(data);
        });
        client.on('end', (data) => {     
            this.parse(`02 e30=`)
        })
    }

    parse(data) {
        data = data.toString().split(' ');
        let code = data[0];
        let contents = JSON.parse(Buffer.from(data[1], 'base64').toString('ascii'));
        console.log(this.codes[code], contents);
        
        this.emit(this.codes[code], contents);
    }
}

module.exports = {User, Reciever, HostServer}
