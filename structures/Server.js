const User = require('./User'),
    Channel = require('./Channel');

module.exports = class Server {
    constructor(name) {
        this.id = "";
        this.createdAt = new Date();

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
        //this.emit('userJoin', user);
    }

    removeUser(user) {
        this.users.splice(this.users.indexOf(user, 1));
        //this.emit('userLeave', user);
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