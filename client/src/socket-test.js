import React, { Component } from 'react';
import io from 'socket.io-client';

class Rooms extends Component {
    constructor (props) {
        super(props);
        this.username = props.username;
        this.messages = [
            'default message 1',
            'default message 2',
            'default message 3'
        ];
        this.socket =  io('/rooms');
        this.socket.on('connect', () => {
            this.socket.on('message', (message) => {
                this.setState({
                    messages: this.messages.push(message)
                });
            });

            this.socket.on('user-list', (userlist) => {
                this.setState({
                    messages: this.messages.push('users: ' + userlist)
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

    messageBlock () {
       let messageBlock = this.messages.map((message, index) => {
            return (
                <div className = 'message'>
                    <span key = {index}>{message}</span>
                </div>
            )
        })
        return messageBlock;
    }

    render() {
        return (
            <div>
                {this.messageBlock()}
            </div>
        )
    }
}

export default Rooms;



