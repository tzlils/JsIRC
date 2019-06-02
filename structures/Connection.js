module.exports = class Connection {
    constructor(websocket) {
        this.ip = websocket.remoteAddress;
        this.websocket = websocket;
        this.channel;
        this.user;
        this.requests = 0;

        setTimeout(() => {
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