import React, { Component } from 'react';
import io from 'socket.io-client';
import './rooms.css';

class Rooms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rooms: [],
            messages: []
        }
        this.username = props.username;
        this.messages = [];
        this.socket = io('/rooms');
        this.socket.on('connect', () => {
            this.socket.on('message', (message) => {
                this.setState({
                    messages: this.messages.push(message)
                });
            });

            this.socket.on('room-list', (roomList) => {
                this.setState({
                    rooms: roomList
                })
            })

            this.socket.emit('signin', this.username);

            setTimeout(() => {
                this.socket.emit('answer', 'this is an answer');
            }, 1000)
        });

        this.socket.on('disconnect', () => {
            this.socket.removeAllListeners('message');
        })
    }

    messageBlock() {
        let messageBlock = this.messages.map((message, index) => {
            let messageElement;
            if (message.room !== undefined) {
                messageElement = <div className='message'>
                    <span key={index}>Room:{message.room} - '{message.data}'</span>
                </div>
            } else {
                messageElement = <div className='message'>
                    <span key={index}>Private Message - '{message}'</span>
                </div>
            }
            return messageElement
        })
        return messageBlock;
    }

    roomList() {
        let rooms = this.state.rooms.map((room) => {
            let userList = room.users.map((user) => {
                return <li className='username'>{user.username}</li>
            });
            let roomElement =
                <div className='room'>
                    <div className='room-name'>{room.name}</div>
                    <div>
                        <ul className='userlist'>{userList}</ul>
                    </div>
                </div>
            return roomElement;
        });
        let roomList = 
                {rooms}
        return roomsList;
    }

    render() {
        return (
            <div>
                <div className = 'room-list'>
                    {this.roomList()}
                </div>
                <div className = 'message-list'>
                    {this.messageBlock()}
                </div>
            </div>
        )
    }
}

export default Rooms;



