module.exports = class User {
    constructor(name) {
        this.id = "";
        this.createdAt = new Date();
        this.name = name;
        this.role = {
            styling: [],
            name: ""
        };
    }
}