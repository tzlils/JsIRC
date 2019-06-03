const crypto = require('crypto');
module.exports = class Transmitter {
    constructor(encryption) {
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
        this.encryption = encryption;
    }

    send(websocket, content) {
        let cipher = crypto.createCipheriv("aes-192-cbc", this.encryption.hash, this.encryption.iv)
        let encrypted = cipher.update(JSON.stringify(content.data), 'utf8', 'hex');
        encrypted += cipher.final('hex')

        let format = `${content.code} ${encrypted}`;
        websocket.sendUTF(format);
    }

    sendAllConnections(connections, content) {
        connections.forEach(connection => {
            this.send(connection.websocket, content)
        });
    }
}