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
        this.config = config;
        this.activeConnections = new Set([]);
        this.transmitter = new Transmitter(config.server.password);

        this.chat = new Server(config.server.name);
        this.defaultChannel = this.chat.createChannel("general");
    }

    start() {
        this.httpServer = http.createServer((req, res) => {
            //console.log("HTTP Request");
            
            res.writeHead(404);
            res.end();
        }).listen(3000, () => {
            console.log("Server is listening");
        })


        this.webSocketServer = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        }).on('request', (req) => {
            //console.log("WebSocket Request");
            
            var connection = req.accept('echo-protocol', req.origin);
            this.emit('websocketConnection', connection, req);
        })

        
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

        this.activeConnections.add(con);
        websocket.on('close', (data) => {
            clearInterval(con.interval);
            this.activeConnections.delete(con)
            this.chat.removeUser(con.user);
        })

        return con;
    }
}