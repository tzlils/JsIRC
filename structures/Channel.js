const Message = require('./Message');
module.exports = class Channel {
    constructor(name, server) {
        this.id = "";
        this.createdAt = new Date();
        
        this.name = name;
        this.server = server;
        this.messages = new Set([]);
    }

    send(content, user) {
        let m = new Message(this, this.server, user, content);
        //if(this.server.users.indexOf(user)) throw new Error("User is not in server!");
        this.messages.add(m);
        return m;
    }

    safe() {
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