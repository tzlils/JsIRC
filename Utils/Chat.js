const ANSI = require('./ANSI');
let chat = {verbose: false};
chat.debug = (msg) => {
    if(!chat.verbose) return;
    chat.message({
        styling: [ "Fg-Green", "Italic"],
        displayname: "DEBUG",
        content: msg,
        timestamp: Date.now()
    })
}

chat.error = (msg) => {
    chat.message({
        styling: [ "Fg-Red", "Underline"],
        displayname: "ERROR",
        content: msg,
        timestamp: Date.now()
    })
}

chat.client = (msg) => {
    chat.message({
        styling: [ "Fg-Cyan", "Bold"],
        displayname: "CLIENT",
        content: msg,
        timestamp: Date.now()
    })
}

chat.ftp = (msg) => {
    chat.message({
        styling: [ "Fg-Blue"],
        displayname: "FTP",
        content: msg,
        timestamp: Date.now()
    })  
}

chat.message = (data) => {
    let content = data.content.split('\n').join('\n=>');
    let f = `<${new Date(data.timestamp).toLocaleTimeString()}> [${ANSI.StyleString(data.displayname, data.styling)}] ${content}\n`
    process.stdout.write(f);
}
module.exports = chat