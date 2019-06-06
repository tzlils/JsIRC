let ansi = {};
ansi.codes = require('./ansi.json');
ansi.toEscapeSeq = (code) => {
    return '\033['+code+ 'm';
}

ansi.NameToCode = (name) => {
    return ansi.codes[name];
}

ansi.insertStyle = (string, style) => {
    return ansi.toEscapeSeq(ansi.NameToCode(style)) + string;
}

ansi.appendReset = (string) => {
    return string + ansi.toEscapeSeq(ansi.NameToCode("Reset"));
}

ansi.StyleString = (string, styles) => {
    styles.forEach(style => {
        string = ansi.insertStyle(string, style);
    });
    string = ansi.appendReset(string);
    return string;
}

module.exports = ansi;