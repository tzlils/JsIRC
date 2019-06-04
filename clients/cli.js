#!/usr/bin/node
const WebSocketClient = require('websocket').client,
    Reciever = require('../structures/Reciever'),
    Transmitter = require('../structures/Transmitter'),
    readlineSync = require('readline-sync');

const escapeCodes = require('./colors.json')

function ANSI(styles, text) {
    let res = ""
    styles.forEach(e => {
        res += '\033['+escapeCodes[e]+ 'm';
    });
    return res + text + '\033[0m'
};

const args = require('yargs').scriptName("client")
.version('0.1').usage('$0 nickname@hostname [options]')
.option('v', {alias: 'verbose', describe: 'Log more information'})
.help().argv;
const parsedArgs = {
    nickname: args._[0].split('@')[0],
    hostname: args._[0].split('@')[1],
    verbose: args.v
}


if(!parsedArgs.hostname || !parsedArgs.nickname) throw new Error('Hostname or Nickname not supplied')

const client = new WebSocketClient();
client.on('connectFailed', (err) => {
    console.log("Connection failed: " + err);
})

client.on('connect', (ws) => {
    let serverPass = readlineSync.question("Server password (leave blank for none): ");
    let userPass;
    const reciever = new Reciever(ws, false, serverPass);
    const transmitter = new Transmitter(serverPass);
    const messages = [];
    reciever.on('connectionSuccessful', (data) => {
        //console.log(`Connected to ${parsedArgs.hostname}`);
        
        transmitter.send(ws, {
            code: transmitter.codes.connectionSuccessful,
            data: {
                
            }
        })
    })

    reciever.on('loginRequest', (data) => {
        userPass = readlineSync.question("User password (leave blank for none): ");
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
        let formattedMessage = `<${ANSI(data.role.styling, data.author)}> ${data.content}`

        messages.push(data);                
        console.log(formattedMessage);
    })

    process.stdin.on('data', (chunk) => {        
        transmitter.send(ws, {
            code: transmitter.codes.dataMessage,
            data: {
                content: chunk,
                author: userPass
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