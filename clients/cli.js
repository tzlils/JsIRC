#!/usr/bin/node
const WebSocketClient = require('websocket').client,
    Reciever = require('../structures/Reciever'),
    Transmitter = require('../structures/Transmitter');

const args = require('yargs').scriptName("client")
.version('0.1').usage('$0 <hostname> <nickname> [options]')
.option('v', {alias: 'verbose', describe: 'Log more information'})
.help().argv;
const parsedArgs = {
    hostname: args._.shift(),
    nickname: args._.join(' '),
    verbose: args.v
}

let profile = {
    ip: ""
}

if(!parsedArgs.hostname || !parsedArgs.nickname) throw new Error('Hostname or Nickname not supplied')

const client = new WebSocketClient();
client.on('connectFailed', (err) => {
    console.log("Connection failed: " + err);
})

client.on('connect', (ws) => {
    const reciever = new Reciever(ws, false);
    const transmitter = new Transmitter(ws);
    reciever.on('connectionSuccessful', (data) => {
        profile.ip = data.ip;
        console.log(`Connected to ${parsedArgs.hostname}`);
        
        transmitter.send(ws, {
            code: transmitter.codes.connectionSuccessful,
            data: {
                ip: ws.remoteAddress
            }
        })
    })

    reciever.on('loginRequest', (data) => {
        transmitter.send(ws, {
            code: transmitter.codes.loginRequest,
            data: {
                nickname: parsedArgs.nickname,
                password: ''
            }
        })
    });

    reciever.on('loginSuccessful', (data) => {        
        transmitter.send(ws, {
            code: transmitter.codes.loginSuccessful,
            data: {
                ip: profile.ip
            }
        })

        console.log('\x1b[2J');
        console.log(`Server: ${data.server.name}`);
        console.log('==========================================');
    })

    reciever.on('dataMessage', (data) => {
        console.log(`<${data.author}> ${data.content}`);
    })

    process.stdin.on('data', (chunk) => {
        transmitter.send(ws, {
            code: transmitter.codes.dataMessage,
            data: {
                ip: client.localAddress,
                content: chunk,
                author: parsedArgs.nickname
            }
        })
        console.log('\033[2A');
    })

    ws.on('error', (err) => {
        console.log("Connection error: " + err);
        process.exit(1);
    });

    ws.on('close', () => {
        console.log(`Connection to ${ws.remoteAddress} abruptly ended`);
        process.exit(1);
    });
})

client.connect(`ws://${parsedArgs.hostname}:3000/`, 'echo-protocol');