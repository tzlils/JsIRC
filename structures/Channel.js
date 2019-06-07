const Message = require('./Message');
module.exports = class Channel {
    constructor(data) {
        this.id = "";
        this.createdAt = data.timestamp || new Date();
        this.name = data.name;
        this.messages = new Set([]);
    }

    send(content, user) {
        let m = new Message(this, this.server, user, content);
        this.messages.add(m);
        return m;
    }

    safe() {
        let safeObj = {
            messages: [],
            name: this.name
        }

        this.messages.forEach(msg => {
            safeObj.messages.push(msg.safe());
        });
        return safeObj
    }
}