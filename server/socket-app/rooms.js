
const async = require('async');

class Room {
    constructor(nsp, name) {
        this.nsp = nsp;
        this.name = name
        this.room = this.nsp.to(this.name);
    }

    join(socket, cb) {
        socket.join(this.name, () => {
            cb();
        });
    }

    leave(socket, cb) {
        socket.leave(this.name, () => {
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

    emit(event, message) {
        let data = {
            room: this.name,
            message: message
        }
        this.room.emit(event, message);
    }

    members() {
        return Object.keys(this.room.sockets);
    }
}

class Rooms {
    constructor(nsp) {
        this.nsp = nsp;
        this.rooms = []
        this.joined = {};
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
                name: room.name
            };
        })
    }

    join(socket, roomName, cb) {
        let room = this.room(roomName) || this.add(roomName);
        this.joined[socket.id] = this.joined[socket.id] || {};
        this.joined[socket.id][roomName] = room;
        room.join(socket, () => {
            cb (room)
        });
    }

    leave(socket, roomName, cb) {
        let _this = this;
        if (roomName === null) {
            let joinedRooms = Object.keys(this.joined[socket.id]);
            async.map(joinedRooms, _this.leave.bind(_this, socket), (err, rooms) => {
                cb(rooms);
            });
        } else {
            let room = this.room(roomName);
            if (room) {
                delete this.joined[socket.id][roomName];
                room.leave(socket, () => {
                    cb(null, room)
                });
            }
        }
    }
}

module.exports = Rooms;