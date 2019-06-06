#!/usr/bin/node
const WebSocketClient = require('websocket').client,
    Reciever = require('../structures/Reciever'),
    Transmitter = require('../structures/Transmitter'),
    chat = require('../Utils/Chat'),
    FTP = require('basic-ftp'),
    fs = require('fs'),
    readlineSync = require('readline-sync');

process.argv.shift(); process.argv.shift();
const parsedArgs = {
    nickname: process.argv[0].split('@')[0],
    hostname: process.argv[0].split('@')[1],
    verbose: process.argv.includes("-v")
}
chat.verbose = parsedArgs.verbose;
function parseDirectory(files) {
    let res = [];
    files.forEach(file => {
        res.push(file.name);
    });
    return res.join(', ');
}

if(!parsedArgs.hostname || !parsedArgs.nickname) throw new Error('Hostname or Nickname not supplied')

const client = new WebSocketClient();
const ftpClient = new FTP.Client();

function openURL(url) {
    var start = (process.platform == 'darwin'? 'open': process.platform == 'win32'? 'start': 'xdg-open');
    require('child_process').exec(start + ' ' + url);
}
function parseFTP(params) {
    switch (params[0]) {
        case 'upload':
            ftpClient.upload(fs.createReadStream(params[1]), params[2]).then(res => {
                chat.debug(JSON.stringify(res));
                chat.ftp(`${params[1]} Uploaded to ${params[2]}`)
            }).catch(res => {
                chat.error(res);
            })
            break;
        case 'download':
            ftpClient.download(fs.createWriteStream('localFTP/'+params[2]), params[1]).then(res => {
                chat.debug(JSON.stringify(res));
                chat.ftp(`${params[1]} Downloaded to ${params[2]}`)
            }).catch(res => {
                chat.error(res);
            })
            break;

        case 'list':
            ftpClient.list().then(res => {
                chat.debug(JSON.stringify(res));
                chat.ftp(parseDirectory(res));
            })
            break;

        case 'open':
            openURL(`ftp://${parsedArgs.hostname}:3001/${params[1]}`);
            chat.client("Opening in browser..");
        default:
            break;
    }
}

client.on('connect', (ws) => {
    let serverPass = readlineSync.question("Server password (leave blank for none): ");
    let userPass;
    const reciever = new Reciever(ws, false, serverPass);
    const transmitter = new Transmitter(serverPass);
    const messages = [];

    function getData(cb) {
        transmitter.send(ws, {
            code: transmitter.codes.requestData,
            data: {
                
            }
        })
        reciever.once('dataInfo', (data) => {
            cb(data);
        })
    
    }



    function parseInput(input) {
        input = input.toString().trim();
        let cmd = (input[0] == "/") ? input.split(' ')[0].substr(1) : false;
        let params = (cmd) ? input.split(cmd)[1].split(' ') : [];      
        params.shift()          
        console.log('\033[2A');

        if(!cmd) {
            if(input.length < 1) return

            transmitter.send(ws, {
                code: transmitter.codes.dataMessage,
                data: {
                    content: input,
                    author: userPass
                }
            })         
        } else {
            switch (cmd) {
                case 'active-users':
                    getData((data) => {
                        chat.client(`Active users: ${data.activeUsers.map(r => r.name).join(',')}`);
                    })
                    break;
                case 'ftp':
                    parseFTP(params);
                    break;
            
                default:
                    chat.error("Command not recognized");
                    break;
            }
        }
    }

    reciever.on('connectionSuccessful', (data) => {
        transmitter.send(ws, {
            code: transmitter.codes.connectionSuccessful,
            data: {
                
            }
        })
    })

    reciever.on('loginRequest', (data) => {
        userPass = readlineSync.question("User password (leave blank for none): ") || " ";
        ftpClient.access({
            host: parsedArgs.hostname,
            user: parsedArgs.nickname,
            password: userPass,
            port: 3001
        }).then(res => {
            chat.ftp("Connected to FTP Server")
            chat.debug(res.message);
            
        })

        transmitter.send(ws, {
            code: transmitter.codes.loginRequest,
            data: {
                nickname: parsedArgs.nickname,
                password: userPass
            }
        })
        process.stdin.resume()
    });

    reciever.on('loginSuccessful', (data) => {
        console.log('\x1b[2J');
        if(data.password) {
            console.log(`!!IMPORTANT!!\n Your password is ${data.password}, use it at your next login\n`);
        }  
        transmitter.send(ws, {
            code: transmitter.codes.loginSuccessful,
            data: {

            }
        })

        console.log(`Server: ${data.server.name}`);
        console.log('==========================================');
    })

    reciever.on('dataMessage', (data) => { 
        messages.push(data);
        chat.message({
            timestamp: data.createdAt,
            styling: data.user.role.styling,
            displayname: data.user.name,
            content: data.content
        });
    })

    process.stdin.on('data',  parseInput)

    ws.on('error', (err) => {
        chat.error("Connection error: " + err);
        process.exit(1);
    });

    ws.on('close', () => {
        chat.error(`Connection to ${ws.remoteAddress} abruptly ended`);
        process.exit(1);
    });
})

client.connect(`ws://${parsedArgs.hostname}:3000/`, 'echo-protocol');