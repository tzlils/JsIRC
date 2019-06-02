module.exports = class Transmitter {
    constructor() {
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

    send(websocket, content) {
        let format = `${content.code} ${Buffer.from(JSON.stringify(content.data)).toString('base64')}`;
        websocket.sendUTF(format);
    }

    sendAllConnections(connections, content) {
        connections.forEach(connection => {
            let format = `${content.code} ${Buffer.from(JSON.stringify(content.data)).toString('base64')}`;
            connection.websocket.sendUTF(format);  
        });
    }
}