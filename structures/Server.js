const User = require('./User'),
    Channel = require('./Channel'),
    Role = require('./Role'),
    Cryptography = require('../Utils/Cryptography');

module.exports = class Server {
    constructor(config, storage) {
        this.createdAt = new Date();
        this.config = config;
        this.storage = storage

        this.name = config.server.name;
        this.channels = new Set([]);
        this.users = new Set([]);
        this.activeUsers = new Set([]);
        this.roles = new Set([]);
        this.systemUser = new User({
            name: "System"
        });
    }

    restoreFromConfig(cb) {
        for (const key in this.storage.server.users) {
            let e = this.storage.server.users[key]
            let user = new User({
                name: e.name,
                timestamp: e.timestamp,
                role: e.role,
                password: e.password
            });

            this.addUser(user);
        }

        for (const key in this.config.roles) {
            let e = this.config.roles[key]
            let role = new Role({
                name: e.name,
                styling: e.styling
            });

            this.roles.add(role);
        }

        
        for (const key in this.config.channels) {
            let e = this.config.channels[key]
            let channel = new Channel({
                name: e.name
            });

            this.channels.add(channel);
        }
        cb();
    }

    /**
    * @deprecated
    */
    createChannel(name) {
        let c = new Channel(name);
        this.channels.add(c);
        return c;
    }

    createUser(username, password = "") {        
        if(this.getUserByName(username)) return;
        let user = new User({
            name: username,
            password: Cryptography.hash(password)
        })
        
        this.storage.server.users[username] = user;
        this.addUser(user);
        return user;
    }
    
    
    addUser(user) {
        this.users.add(user);
    }

    removeUser(user) {
        this.users.delete(user);
    }

    getUserByName(username) {
        for (const user of this.users) {
            if(user.name == username) return user;
        }
    }

    compareUserPassword(username, password) {
        let user = this.getUserByName(username);
        return Cryptography.compareHash(password, user.password);
    }
    safe() {        
        let safeObj = {
            name: this.name,
            channels: [],
            users: [],
            activeUsers: [],
            roles: this.roles,
            createdAt: this.createdAt,
            defaultChannel: this.defaultChannel
        }
        
        this.channels.forEach(ch => {
            safeObj.channels.push(ch.safe());
        });

        this.users.forEach(u => {
            safeObj.users.push(u.safe());
        })
        
        this.activeUsers.forEach(u => {
            safeObj.activeUsers.push(u.safe());
        })
        return safeObj;
    }
};