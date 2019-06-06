module.exports = class Role {
    constructor(data) {
        this.id = "";
        this.createdAt = data.timestamp || new Date();
        this.name = data.name;
        this.styling = data.styling || [];
    }

    safe() {
        return this
    }
}