let fs = require('fs');
let path = require('path');
let io = require('socket.io');

class socketApp {
    constructor(http) {
        this.io = io(http);
        let connectionDir = './connections';
        let files = fs.readdirSync(path.join(__dirname, connectionDir));
        if (files) {
            files.forEach((file) => {
                try {
                    let connectionName = path.basename(file,'.js');
                    let Connection = require(path.join(__dirname, connectionDir, file));
                    new Connection(this.io, connectionName);
                }
                catch (ex) {
                    console.log("Unable to load socket connection " + file + '\n' + ex.stack);
                }
            })
        }
    }
}

module.exports = socketApp;