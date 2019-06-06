module.exports = class Message {
    constructor(channel, server, user, content) {
        this.id = "";
        this.createdAt = new Date();
        this.channel = channel;
        this.server = server;
        this.user = user;
        this.content = content;
    }

    safe() {
        let safeObj = {
            content: this.content,
            user: this.user.safe(),
            createdAt: this.createdAt
        }
        return safeObj;
    }
}