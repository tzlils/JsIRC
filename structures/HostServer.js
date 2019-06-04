const EventEmitter = require('events'),
    Transmitter = require('./Transmitter'),
    Server = require('./Server'),
    Connection = require('./Connection'),
    WebSocketServer = require('websocket').server,
    http = require('http'),
    FtpSrv = require('ftp-srv');

module.exports = class HostServer extends EventEmitter {
    constructor(config, storage) {
        super();
        this.config = config;
        this.activeConnections = new Set([]);
        this.transmitter = new Transmitter(config.server.password);

        this.chat = new Server(config, storage);
        this.chat.restoreFromConfig();
        this.defaultChannel = this.chat.createChannel("general");
    }

    start() {
        this.httpServer = http.createServer((req, res) => {
            res.writeHead(404);
            res.end();
        })

        this.webSocketServer = new WebSocketServer({
            httpServer: this.httpServer,
            autoAcceptConnections: false
        })

        this.ftpServer = new FtpSrv({
            greeting: `Joining ${config.server.name}`,
            pasv_min: 3000,
            pasv_max: 3000,
            blacklist: ['RMD', 'RNFR', 'RNTO']
        });



        this.ftpServer.on('login', ({connection, username, password}, resolve, reject) => {
            console.log("New login");
            console.log(connection, username, password); 
            resolve();
        });

        this.webSocketServer.on('request', (req) => {
            var connection = req.accept('echo-protocol', req.origin);
            this.emit('websocketConnection', connection, req);
        })

        //this.ftpServer.listen();
        this.httpServer.listen(3000, () => {
            console.log("Server is listening");
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
            //this.chat.removeUser(con.user);
        })

        return con;
    }
}