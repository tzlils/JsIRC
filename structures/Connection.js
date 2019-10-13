module.exports = class Connection {
    constructor(socket) {
        this.ip = socket.remoteAddress;
        this.socket = socket;
        this.channel;
        this.user;
        this.requests = 0;

        this.interval = setInterval(() => {
            this.requests = 0;
        }, 1000)
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
        console.log(error);
        
        //this.sock.end(error.toString());
        //this.sock.destroy();
    }
}