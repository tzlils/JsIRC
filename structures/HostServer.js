const EventEmitter = require('events'),
    Transmitter = require('./Transmitter'),
    Server = require('./Server'),
    Connection = require('./Connection'),
    WebSocketServer = require('websocket').server,
    http = require('http'),
    crypto = require('crypto');

module.exports = class HostServer extends EventEmitter {
    constructor(config) {
        super();
        this.httpServer = http.createServer((req, res) => {
            response.writeHead(404);
            response.end();
        }).listen(3000, () => {
            console.log("Server is listening");
        })
        this.server = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        }).on('request', (req) => {
            var connection = req.accept('echo-protocol', req.origin);
            this.emit('connection', connection, req);
        })
    
        this.activeConnections = [];
        this.transmitter = new Transmitter({
            hash: crypto.scryptSync(config.server.password, 'salt', 24),
            iv: Buffer.alloc(16, 0)
        });

        this.chat = new Server(config.server.name);
        this.chat.createChannel("general");
        this.defaultChannel = this.chat.channels[0];
    }

    isConnected(ip) {
        let r = false;
        this.activeConnections.forEach(con => {
            if(con.ip == ip) r = true;
        });
        return r;
    }

    addConnection(websocket) {
        let con = new Connection(websocket);
        if(this.isConnected(con.ip)) {
            //con.throwError(Error("Already connected"));
            //return;
        };

        this.activeConnections.push(con);
        websocket.on('close', (data) => {
            clearInterval(con.interval);
            this.activeConnections.splice(this.activeConnections.indexOf(con, 1))
            this.chat.removeUser(con.user);
        })

        return con;
    }
}