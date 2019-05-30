const EventEmitter = require('events');
class Object extends EventEmitter{
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
}

class User extends Object {
    constructor(name) {
        super();
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
        this.sock.write(JSON.stringify(chat, (key, value) => {
            if(key == 'server' || key == 'channel') { 
              return value.id;
            } else {
              return value;
            };
        }))
    }
}

class Channel extends Object {
    constructor(name, guild) {
        super();
        this.name = name;
        this.server = guild;
        this.messages = [];
    }

    send(content, user) {
        let m = new Message(this, this.server, user, content);
        //if(this.server.users.indexOf(user)) throw new Error("User is not in server!");
        this.messages.push(m);
        this.emit('message', m)
    }
}

class Message extends Object {
    constructor(channel, server, author, content) {
        super();
        this.channel = channel;
        this.server = server;
        this.author = author;
        this.content = content;
    }
}

module.exports.User = User;
module.exports.Connection = Connection;
module.exports.Server = Server;