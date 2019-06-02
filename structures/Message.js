module.exports = class Message {
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