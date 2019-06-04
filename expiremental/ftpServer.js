const FtpSrv = require('ftp-srv');

const ftpServer = new FtpSrv({
    greeting: 'foobar',
    pasv_min: 3001,
    pasv_max: 3001,
    blacklist: ['RMD', 'RNFR', 'RNTO']
});

ftpServer.on('login', ({connection, username, password}, resolve, reject) => {
    console.log("New login");
    console.log(connection, username, password); 
    resolve();
});

ftpServer.listen().then(() => {
    
});