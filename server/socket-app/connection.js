class Connection {
    constructor(io, connectionName) {
        this.io = io;
        this.connectionName = connectionName;
        this.server = this.io.of('/' + connectionName);
        this.clients = {};
        this.server.on('connection', (socket) => {
            let onevent = socket.onevent;
            socket.onevent = function (packet) {
                console.log("SocketApp '" + connectionName + "' received: " + JSON.stringify(packet.data) + ' from ' + socket.id);
                onevent.call(this, packet);    // original call
            };
            this.clients[socket.id] = {
                socket: socket
            };
            this.onConnect(socket)
        });
        console.log("Loaded socket connection '" + this.connectionName + "'")
    }
}

module.exports = Connection;