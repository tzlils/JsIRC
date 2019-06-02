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

if(!parsedArgs.hostname || !parsedArgs.nickname) throw new Error('Hostname or Nickname not supplied')


const client = new WebSocketClient();
client.on('connectFailed', (err) => {
    console.log("Connection failed: " + err);
})

client.on('connect', (ws) => {
    const reciever = new Reciever(ws);
    const transmitter = new Transmitter(ws);
    parsedArgs.ip = ws.remoteAddress;
    //        console.log('\x1b[2J');

    reciever.on('connectionSuccessful', (data) => {
        parsedArgs.ip = client.remoteAddress;
        console.log(`Connected to ${parsedArgs.hostname}`);
        
        transmitter.send(ws, {
            code: transmitter.codes.connectionSuccessful,
            data: {
                ip: client.localAddress
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
                
            }
        })

        //console.log(`Server: ${data.server.name}`);
        //console.log(`Channel: ${data.channels[0].name}`)
        //console.log('==========================================');
    })

    process.stdin.on('data', (chunk) => {
        transmitter.send(ws, {
            code: transmitter.codes.dataMessage,
            data: {
                ip: client.localAddress,
                content: chunk.toString().trim(),
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
        console.log(`Connection to ${parsedArgs.ip} abruptly ended`);
        process.exit(1);
    });
})

client.connect(`ws://${parsedArgs.hostname}:3000/`, 'echo-protocol');

/*
const client = net.createConnection(3000, parsedArgs.hostname , (sock) => {

    reciever.on('dataMessage', (data) => {

    })

    /*
    client.on('data', (chunk) => {
        let info = JSON.parse(chunk.toString());
        let msg = info.channels[0].lastmsg;
        if(!msg) return;
        if(firstLogin) {
            console.log(`Server: ${info.server.name}`);
            console.log(`Channel: ${info.channels[0].name}`)
            console.log('==========================================');
            firstLogin = false;
            return;
        }

        //if(msg.author.name != parsedArgs.nickname) {
            //TODO: Notifications
        //}
        //msgs.map(r => `${r.author.name}: ${r.content}`).join('\n')
        console.log(`${msg.author.name}: ${msg.content}`)
    })*/
//})






























/*
function parseArgs(argv) {    
    let args = {};
    const help = {
        'usage': 'client.js [hostname] [options]',
        'options': {
            '-v, --version': 'print client version',
            '--verbose': 'log more information',
            '-n, --nickname': 'use nickname'
        }
    }

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        args.hostname = argv[2];
        if(arg == '-h') {
            console.log(`Usage: ${help.usage}\n\nOptions:`);
            Object.keys(help.options).forEach((key) => {
                console.log(` ${key}\t\t${help.options[key]}`);
            });
        } else if(arg == '-v' || arg == '--version') {
            console.log(`v${application.version}`);
        } else if(arg == '--verbose') {
            args.verbose = true;
        } if(arg == '-n' || arg == '--nickname') {
            console.log("Warning: Names cannot contain spaces");
            args.nickname = argv[i+1];
        }
    }
    return args;
}
*/