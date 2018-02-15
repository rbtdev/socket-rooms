const Connection = require('../connection');

class Room {
    constructor (server, id) {
        this.server = server;
        this.id = id;
        this.room = this.server.to(this.id);
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

    emit (message, data) {
        this.room.emit(message, data);
    }
}

class App extends Connection {
    constructor(server, connectionName) {
        super(server, connectionName);
        this.room = new Room (this.server, 'room-1');
        this.users = [];
    }

    onConnect(socket) {
        var _this = this;
        this.room.add(socket, (err) => {
            socket.on('signin', (username) => {
                _this.clients[socket.id].username = username;
                socket.emit('message', 'private message')
                _this.room.emit('user-list', _this.userList());

                if (_this.userList().length === 2) {
                    this.room.on('answer', _this.checkAnswer.bind(_this));
                }
            })
        });

        socket.on('disconnect', () => {
            console.log('socket disconnected');
            clearInterval(this.messageTimer);
        })
    }

    checkAnswer (socket, answer) {
        console.log('Recieved: "' + answer + '" from socket ' + socket.id);
        socket.emit('right');
    }

    userList () {
        let userList = Object.keys(this.clients).map((client) => {
            return client.username;
        })
        return userList;
    }
}


module.exports = App;