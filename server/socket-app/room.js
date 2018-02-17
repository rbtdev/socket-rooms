class Room {
    constructor (nsp, id) {
        this.nsp = nsp;
        this.id = id;
        this.room = this.nsp.to(this.id);
    }

    add (socket, cb) {
        socket.join(this.id, () => {
            socket.emit('join', this.id);
            cb();
        });
    }

    remove (socket, cb) {
        socket.leave(this.id, () => {
            socket.emit('leave', this.id);
            cb();
        });
    }

    on (event, cb) {
        let sockets = this.room.sockets;
        Object.keys(sockets).forEach((socketId) => {
            let socket = sockets[socketId];
            console.log("Adding '" + event + ' to ' + socket.id)
            socket.on(event, cb.bind(null, socket));
        });
    }

    off (event) {
        let sockets = this.room.sockets;
        Object.keys(sockets).forEach((socketId) => {
            let socket = sockets[socketId];
            console.log("Removing '" + event + ' for ' + socket.id)
            sockets[socket].removeAllListeners(event);
        });
    }

    emit (event, data) {
        let message = {
            data: data,
            room: this.id
        };
        this.room.emit(event, message);
    }

    members () {
        return Object.keys(this.room.sockets);
    }
}

module.exports = Room;