const Cryptography = require('../Utils/Cryptography');
module.exports = class Transmitter {
    constructor(encryptionKey) {
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
            dataDebug: '11',
            requestData: '12'
        }
        this.encryption = encryptionKey;
    }

    send(socket, content) {
        let encrypted = Cryptography.encrypt(this.encryption, JSON.stringify(content.data))
        let format = `${content.code} ${encrypted}`;
        socket.write(format)
    }

    sendAllConnections(connections, content) {
        connections.forEach(connection => {
            
            this.send(connection.socket, content)
        });
    }
}