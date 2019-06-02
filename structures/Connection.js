module.exports = class Connection {
    constructor(websocket) {
        this.ip = websocket.remoteAddress;
        this.websocket = websocket;
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
        console.log(error);
        
        //this.sock.end(error.toString());
        //this.sock.destroy();
    }

    sendData(chat) {
        /*
        * Only send essential information and get rid of circulars
        * Only send latest message
        */
        //JSON.stringify(safeObj)
    }
}