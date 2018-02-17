
class Room {
    constructor(nsp, name) {
        this.nsp = nsp;
        this.name = name
        this.messages = [];
        this.room = this.nsp.to(this.name);
    }

    join(socket, cb) {
        socket.join(this.name, () => {
            socket.emit('join', this.name);
            cb();
        });
    }

    leave(socket, cb) {
        socket.leave(this.name, () => {
            socket.emit('leave', this.name);
            cb();
        });
    }

    on(event, cb) {
        let sockets = this.room.sockets;
        Object.keys(sockets).forEach((socketId) => {
            let socket = sockets[socketId];
            console.log("Adding '" + event + ' to ' + socket.id)
            socket.on(event, cb.bind(null, socket));
        });
    }

    off(event) {
        let sockets = this.room.sockets;
        Object.keys(sockets).forEach((socketId) => {
            let socket = sockets[socketId];
            console.log("Removing '" + event + ' for ' + socket.id)
            sockets[socket].removeAllListeners(event);
        });
    }

    emit(event, data) {
        let message = {
            data: data,
            room: this.name
        };
        this.messages.push(message);
        this.room.emit(event, message);
    }

    members() {
        return Object.keys(this.room.sockets);
    }

    get messages () {
        return this._messages;
    }

    set messages (value) {
        this._messages = value;
    }
}

class Rooms {
    constructor(nsp) {
        this.nsp = nsp;
        this.rooms = []
    }

    add(nameList) {
        let names = [].concat(nameList);
        let result = [];
        names.forEach((name) => {
            result.push(new Room(this.nsp, name));
        })
        this.rooms = this.rooms.concat(result);
        return result.length > 1 ? result : result[0];
    }

    room(name) {
        return this.rooms.find((room) => {
            return (room.name === name);
        })
    }
    list() {
        return this.rooms.map((room) => {
            return {
                name: room.name,
                members: room.members(),
                messages: room.messages
            };
        })
    }
}

module.exports = Rooms;