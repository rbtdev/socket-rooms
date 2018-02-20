const Connection = require('../connection');
const Rooms = require('../rooms');
const async = require('async');


class Chat extends Connection {
    constructor(nsp, connectionName) {
        super(nsp, connectionName);
        this.rooms = new Rooms(this.nsp);
        this.messages = [];
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
                _this.clients[socket.id] = {
                    username: user.username,
                    socket: socket
                };
                socket.emit('welcome', user);
                socket.on('list-rooms', _this.listRooms.bind(_this, socket));
                socket.on('list-members', _this.listMembers.bind(_this, socket));
                socket.on('list-messages', _this.listMessages.bind(_this, socket))
                socket.on('message', _this.newMessage.bind(_this, socket));
                socket.on('join-room', _this.joinRoom.bind(_this, socket));
                socket.on('add-room', _this.addRoom.bind(_this, socket));
            });
        });

        socket.on('disconnect', () => {
            console.log('socket disconnected');
            let username = _this.clients[socket.id].username;
            this.rooms.leave(socket, null, (rooms) => {
                rooms.forEach((room) => {
                    room.emit('left', {
                        room: room.name,
                        username:username
                    });
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

    addRoom (socket, roomName, mode, cb) {
        let _this = this;
        mode = mode || 'public';
        let room = this.rooms.room(roomName)
        if (room) {
            cb ('Room already exists');
        } else {
            room = this.rooms.add(roomName, mode);
            if (!room) return cb('Error creating room');
            else {
                if (mode === 'private') {
                    let sender = socket;
                    let recipientId = Object.keys(_this.clients).find((socketId) => {
                        return _this.clients[socketId].username === roomName
                    });
                    let recipient = _this.clients[recipientId].socket;
                    _this.listRooms(sender, 'all');
                    _this.listRooms(recipient, 'all');
                    _this.joinRoom(sender, roomName);
                    _this.joinRoom(recipient, roomName);
                }
                cb ();
            }
        }
    }

    joinRoom(socket, roomName) {
        let _this = this;
        this.rooms.join(socket, roomName, (room) => {
            let members = _this.getRoomMembers(roomName);
            if (members !== null) {
                room.emit('joined', {
                    username: _this.clients[socket.id].username,
                    room: roomName
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

    listMessages(socket, room) {
        this.getRoomMessages(room, (err, messages) => {
            if (err) console.log("Error getting room messages " + JSON.stringify(err));
            socket.emit('message-list', {
                room: room,
                messages: messages
            })
        });
    }

    newMessage(socket, data) {
        let room = this.rooms.room(data.room);
        if (room) {
            let message = {
                message: data.message,
                sender: this.clients[socket.id].username
            }
            this.saveMessage(data.room, message, (err, message) => {
                if (err) return console.log('error saving message ' + JSON.stringify(err));
                room.emit('new-message', message);
            })
        } else {
            console.log('invalid room ' + data.room);
            // socket is not in the room in the message, ignore
        }
    }

    // this will save the message in a db and send the saved message with
    // an id and timestamp back to the callback
    saveMessage(room, message, cb) {
        let _this = this;
        setTimeout(() => {
            message.timestamp = new Date().getTime();
            message.id = this.messages.length;
            message.room = room;
            this.messages.push(message);
            cb(null, message)
        }, 100);
    }

    // this will retrieve messages from the db given a room name
    getRoomMessages(room, cb) {
        let _this = this;
        setTimeout(() => {
            let messages = _this.messages.filter(message => {
                return message.room === room;
            })
            cb(null, messages);
        }, 100)
    }
}


module.exports = Chat;