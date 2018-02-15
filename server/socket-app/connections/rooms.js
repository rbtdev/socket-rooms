const Connection = require('../connection');
const Room = require('../room');

class Rooms extends Connection {
    constructor(nsp, connectionName) {
        super(nsp, connectionName);
        this.room = new Room (this.nsp, 'room-1');
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


module.exports = Rooms;