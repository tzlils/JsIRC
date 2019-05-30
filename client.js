#!/usr/bin/node
const net = require('net');
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

const client = net.createConnection(3000, parsedArgs.hostname , (sock) => {
    let firstLogin = true;
    parsedArgs.ip = client.remoteAddress;
    console.log(`Connected to ${parsedArgs.ip}`);
    client.write(parsedArgs.nickname);

    client.on('close', (chunk) => {
        console.log(`Connection to ${parsedArgs.hostname}(${parsedArgs.ip}) abruptly ended`);
        process.exit();
    })

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
    })

    process.stdin.on('data', (chunk) => {
        client.write(chunk.toString().trim());
        console.log('\033[2A');
   })
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