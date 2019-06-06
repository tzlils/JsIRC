const crypto = require('crypto');
const bcrypt = require('bcrypt');

let cryp = {};

cryp.hash = function(text) {
    return bcrypt.hashSync(text, 10);
}

cryp.compareHash = function(text, hash) {
    return bcrypt.compareSync(text, hash);
}

cryp.generatePassword = function(length = 8) {
    var result = [];
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for ( var i = 0; i < length; i++ ) {
       result.push(characters[Math.floor(Math.random() * characters.length)]);
    }
    return result.join('');
}

cryp.encrypt = function (KEY, text) {
    KEY = crypto.scryptSync(KEY, 'salt', 24)
    const cipher = crypto.createCipher('aes-192-cbc', KEY);
    var encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

cryp.decrypt = function (KEY, encryptedText) {
    KEY = crypto.scryptSync(KEY, 'salt', 24)
    const decipher = crypto.createDecipher('aes-192-cbc', KEY);
    var decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf-8');
    return decrypted;
};

module.exports = cryp;