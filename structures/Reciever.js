const EventEmitter = require('events');
module.exports = class Reciever extends EventEmitter {
    constructor(websocket) {
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
        
        websocket.on('message', (data) => {
            this.parse(data.utf8Data);
        });
        
        websocket.on('close', (data) => {     
            this.parse(`02 e30=`)
        })
    }

    parse(data) {
        data = data.toString().split(' ');
        let code = data[0];
        let contents = JSON.parse(Buffer.from(data[1], 'base64').toString('ascii'));
        console.log(this.codes[code], contents);
        
        this.emit(this.codes[code], contents);
    }
}