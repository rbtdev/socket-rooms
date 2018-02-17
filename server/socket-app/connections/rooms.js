const Connection = require('../connection');
const Room = require('../room');

class Rooms {
    constructor(nsp) {
        this.nsp = nsp;
        this.rooms = []
        this.nextId = 0;
    }

    add() {
        let room = new Room(this.nsp, this.nextId++);
        this.rooms.push(room);
        return room
    }

    list() {
        return this.rooms.map((room) => {
            return {
                id: room.id,
                members: room.members()
            };
        })
    }
}
class App extends Connection {
    constructor(nsp, connectionName) {
        super(nsp, connectionName);
        this.rooms = new Rooms(this.nsp);
        this.room = this.rooms.add();
        this.users = [];
    }

    onConnect(socket) {
        var _this = this;
        this.room.add(socket, (err) => {
            socket.on('signin', (username) => {
                _this.clients[socket.id].username = username;
                //socket.emit('message', 'private message')
                socket.emit('room-list', _this.roomList());
                this.room.on('answer', _this.checkAnswer.bind(_this));
            })
        });

        socket.on('disconnect', () => {
            console.log('socket disconnected');
            clearInterval(this.messageTimer);
        })
    }

    checkAnswer(socket, answer) {
        console.log('Recieved: "' + answer + '" from socket ' + socket.id);
        //this.room.emit('message', socket.id + ' answered')
    }

    roomList() {
        let _this = this;
        return this.rooms.list().map((room) => {
            return {
                name: room.id,
                users: room.members.map((member) => {
                    return {
                        username: _this.clients[member].username
                    }
                })
            }
        })
    }
}


module.exports = App;