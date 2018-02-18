const Connection = require('../connection');
const Rooms = require('../rooms');
const async = require('async');


class Chat extends Connection {
    constructor(nsp, connectionName) {
        super(nsp, connectionName);
        this.rooms = new Rooms(this.nsp);
        this.defaultRoom = 'general';
        this.defaultRooms = [this.defaultRoom, 'software', 'react', 'ingress', 'dev-ops']
        this.rooms.add(this.defaultRooms);
        this.users = [];
    }

    onConnect(socket) {
        var _this = this;
        let joinRooms = this.defaultRooms.map(roomName => {
            let room = this.rooms.room(roomName);
            return room.join.bind(room);
        })
        async.applyEach(joinRooms, socket, (err) => {
            socket.on('signin', (username) => {
                _this.clients[socket.id].username = username;
                socket.emit('room-list', _this.roomList());
                socket.on('message', _this.newMessage.bind(_this, socket));
                socket.on('join', this.join.bind(_this, socket));
            })
        })

        socket.on('disconnect', () => {
            console.log('socket disconnected');

            clearInterval(this.messageTimer);
        })
    }

    join(socket, roomName) {
        let room = this.rooms.room(roomName) || this.rooms.add(roomName);
        room.join(socket, (err) => {
            socket.emit('join', roomName);
            socket.emit('room-list', this.roomList())
        });
    }

    newMessage(socket, data) {
        if (socket.rooms[data.room]) {
            this.rooms.room(data.room).emit('message', {
                message: data.message,
                sender: this.clients[socket.id].username
            });
        } else {
            console.log('invalid room ' + data.room);
            // socket is not in the room in the message, ignore
        }
    }

    roomList() {
        let _this = this;
        let roomList = this.rooms.list().map((room) => {
            return {
                name: room.name,
                members: room.members.map((member) => {
                    return {
                        username: _this.clients[member].username
                    }
                }),
                messages: room.messages
            }
        })
        return roomList
    }
}


module.exports = Chat;