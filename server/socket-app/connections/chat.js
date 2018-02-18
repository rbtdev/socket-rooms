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

    authenticate(credentials, cb) {
        let user = {
            username: credentials.username,
            name: 'Joe User',
            email: 'joe@.joe.com'
        }
        //
        // Add Db lookup and authentication herer
        //
        // Simulate a db async return with 100ms delay
        setTimeout(() => { return cb(null, user) }, 100)
    }

    onConnect(socket) {
        var _this = this;
        socket.on('signin', (credentials) => {
            this.authenticate(credentials, (err, user) => {
                if (err || !user) return socket.emit('signin', null);
                _this.clients[socket.id].username = user.username;
                socket.emit('signin', user);
                socket.on('list-rooms', _this.listRooms.bind(this, socket));
                socket.on('list-members', this.listMembers.bind(this, socket));
                socket.on('list-messages', this.listMessages.bind(this, socket))
                socket.on('message', _this.newMessage.bind(_this, socket));
                socket.on('join-room', this.joinRoom.bind(_this, socket));
            });
        });

        socket.on('disconnect', () => {
            console.log('socket disconnected');
            let username = _this.clients[socket.id].username;
            this.rooms.leave(socket, null, (rooms) => {
                rooms.forEach((room) => {
                    room.emit('left', username);
                    delete _this.clients[socket.id];
                })
            })
        })
    }

    listRooms(socket) {
        socket.emit('room-list', this.roomList());
    }

    roomList() {
        return this.rooms.list().map(room => { return room.name })
    }

    joinRoom(socket, roomName) {
        let _this = this;
        this.rooms.join(socket, roomName, (room) => {
            let members = _this.getRoomMembers(roomName);
            if (members !== null) {
                room.emit('joined', {
                    username: _this.clients[socket.id].username
                });
            }
        });
    }

    getRoomMembers(roomName) {
        let _this = this;
        let room = this.rooms.room(roomName);
        let members = null;
        if (room) {
            members = room.members().map((socketId) => {
                return {
                    username: _this.clients[socketId].username
                };
            })
        }
        return members;
    }

    listMembers(socket, roomName) {
        let _this = this;
        let members = this.getRoomMembers(roomName);
        if (members !== null) {
            socket.emit('member-list', {
                room: roomName,
                members: members
            })
        } else {
            // send error ?
        }
    }

    listMessages(socket, roomName) {
        let room = this.rooms.room(roomName);
        if (room) {
            socket.emit('message-list', {
                room: roomName,
                messages: room.messages
            })
        } else {
            // send error ?
        }
    }

    newMessage(socket, data) {
        if (socket.rooms[data.room]) {
            this.rooms.room(data.room).emit('message', {
                timestamp: new Date().getTime(),
                message: data.message,
                sender: this.clients[socket.id].username
            });
        } else {
            console.log('invalid room ' + data.room);
            // socket is not in the room in the message, ignore
        }
    }
}


module.exports = Chat;