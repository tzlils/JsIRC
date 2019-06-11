const EventEmitter = require('events'),
    Transmitter = require('./Transmitter'),
    Server = require('./Server'),
    Connection = require('./Connection'),
    WebSocketServer = require('websocket').server,
    http = require('http'),
    FtpSrv = require('ftp-srv'),
    buyan = require('bunyan');

module.exports = class HostServer extends EventEmitter {
    constructor(config, storage) {
        super();
        this.config = config;
        this.activeConnections = new Set([]);
        this.transmitter = new Transmitter(config.server.serverPassword);

        this.chat = new Server(config, storage);
        this.chat.restoreFromConfig(() => {
            this.defaultChannel = this.chat.channels.values().next().value;            
        });
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
            log: buyan.createLogger({
                name: 'ftp-srv',
                level: 'error'
            }),
            url: 'ftp://0.0.0.0:3001',
            pasv_min: 3002,
            pasv_max: 3002,
            pasv_url: '0.0.0.0',
            anonymous: false,
            file_format: 'ls',
            blacklist: ['RMD', 'RNFR', 'RNTO'],
            whitelist: [ ],
            greeting: null,
            tls: false,
            timeout: 0
          });



        this.ftpServer.on('login', ({connection, username, password}, resolve, reject) => {
            if(this.config.server.serverPassword == "") {
                console.log("Server password not set, refusing all connections");
                reject("FTP Server disabled: Server password not set");
                return;
            }

            if(!this.config.server.passwordRequired) {
                resolve({
                    root: this.config.server.ftpDir
                });
                return; 
            }

            if(this.chat.getUserByName(username)) {
                if(this.chat.compareUserPassword(username, password)) {
                    resolve({
                        root: this.config.server.ftpDir
                    });
                } else {
                    reject();
                }
            } else {
                reject();
            }

        });

        this.webSocketServer.on('request', (req) => {
            var connection = req.accept('echo-protocol', req.origin);
            this.emit('websocketConnection', connection, req);
        })

        if(this.config.server.ftp) this.ftpServer.listen(3001);
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