#!/usr/bin/node
const net = require('net');
const EventEmitter = require('events');
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
require('dns').resolve(parsedArgs.hostname, (err, res) => {
    if(err) throw new Error('Incorrect hostname');
});







class Transmitter {
    constructor(sock) {
        this.sock = sock;
        this.codes = {
            connectionSuccessful: '01',
            connectionRefused: '02',
            requestSuccessful: '03',
            requestRefused: '04',
            responseSuccess: '05',
            responseRefused: '06',
            loginSuccessful: '07',
            loginRequest: '08',
            dataMessage: '09',
            dataInfo: '10',
            dataDebug: '11'
        }
    }

    send(content) {
        let format = `${content.code} ${Buffer.from(JSON.stringify(content.data)).toString('base64')}`;
        this.sock.write(format);
    }
}

class Reciever extends EventEmitter {
    constructor(client) {
        super();
        this.codes = {
            '01': 'connectionSuccessful',
            '02': 'connectionRefused',
            '03': 'requestSuccessful',
            '04': 'requestRefused',
            '05': 'responseSuccess',
            '06': 'responseRefused',
            '07': 'loginSuccessful',
            '08': 'loginRequest',
            '09': 'dataMessage',
            '10': 'dataInfo',
            '11': 'dataDebug'
        }
        client.on('data', (data) => {
            this.parse(data);
        });
    }

    parse(data) {
        data = data.toString();
        let code = data.split(' ')[0];
        let contents = JSON.parse(Buffer.from(data.split(' ')[1], 'base64').toString('ascii'));
        console.log(this.codes[code], contents, '\n');
        
        this.emit(this.codes[code], contents);
    }
}

const client = net.createConnection(3000, parsedArgs.hostname , (sock) => {
    const reciever = new Reciever(client);
    const transmitter = new Transmitter(client);

    reciever.on('connectionSuccessful', (data) => {
        console.log('\x1b[2J');
        parsedArgs.ip = client.remoteAddress;
        console.log(`Connected to ${parsedArgs.ip}`);
        
        transmitter.send({
            code: transmitter.codes.connectionSuccessful,
            data: {
                ip: client.localAddress
            }
        })
    })

    reciever.on('loginRequest', (data) => {
        transmitter.send({
            code: transmitter.codes.loginRequest,
            data: {
                nickname: parsedArgs.nickname,
                password: ''
            }
        })
    });

    reciever.on('loginSuccesful', (data) => {
        console.log(`Server: ${data.server.name}`);
        console.log(`Channel: ${data.channels[0].name}`)
        console.log('==========================================');
    })

    reciever.on('dataMessage', (data) => {

    })

    process.stdin.on('data', (chunk) => {
        transmitter.send({
            code: transmitter.codes.dataMessage,
            data: {
                ip: client.localAddress,
                content: chunk.toString().trim(),
                author: parsedArgs.nickname
            }
        })
        console.log('\033[2A');
    })


    client.on('close', (chunk) => {
        console.log(`Connection to ${parsedArgs.hostname}(${parsedArgs.ip}) abruptly ended`);
        process.exit();
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
})






























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