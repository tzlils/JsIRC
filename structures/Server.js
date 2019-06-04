const User = require('./User'),
    Channel = require('./Channel');

module.exports = class Server {
    constructor(name) {
        this.id = "";
        this.createdAt = new Date();

        this.name = name;
        this.channels = new Set([]);
        this.users = new Set([]);
        this.systemUser = new User("System");
    }

    createChannel(name) {
        let c = new Channel(name, this);
        this.channels.add(c);
        return c;
    }
    
    addUser(user) {
        this.users.add(user);
    }

    removeUser(user) {
        this.users.delete(user);
    }

    getUserByName(username) {
        for (let i = 0; i < this.users.length; i++) {
            if(this.users[i].name == username) return this.users[i];
        }
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
};