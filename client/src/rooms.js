import React, { Component } from 'react';
import update from 'immutability-helper';
import io from 'socket.io-client';
import './rooms.css';

class Room extends Component {
    constructor(props) {
        super(props);
        this.username = props.username;
        this.members = props.members;
        this.messages = props.messages;
        this.state = {
            messages: this.messages,
            members: this.members
        }
    }
    componentWillReceiveProps(nextProps) {
        this.setState({
            messages: nextProps.messages,
            members: nextProps.members
        });
    }

    setMembers(members) {
        this.setState({ members: members });
    }

    setMessages(messages) {
        this.setState({ messages: messages })
    }

    scrollToBottom() {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    }

    componentDidMount() {
        this.scrollToBottom();
    }

    componentDidUpdate() {
        this.scrollToBottom();
    }
    renderMessages() {
        let messages = this.state.messages.map((message, index) => {
            let messageClass = 'message';
            if (message.data.sender === this.username) messageClass += ' owner';
            return (
                <div className={messageClass} key={index}>
                    <div className='message-sender'>
                        {message.data.sender}
                    </div>
                    <div className='message-content'>
                        {message.data.message}
                    </div>
                </div>
            )
        })
        let messageList =
            <div className='message-list'>
                {messages}
                <div style={{ float: "left", clear: "both" }} ref={(el) => { this.messagesEnd = el; }}></div>
            </div>
        return messageList;
    }

    render() {
        return (
            <div>
                <div className='room-title'>{this.props.name}</div>
                {this.renderMessages()}
            </div>)
    }

}
class Rooms extends Component {
    constructor(props) {
        super(props);
        this.state = {
            rooms: [],
            activeRoom: ''
        }
        this.credentials = {
            username: props.username,
            password: props.password
        }
        this.socket = io('/chat');
        this.socket.on('connect', () => {
            this.socket.emit('signin', this.credentials);
            this.socket.on('signin', this.setUser.bind(this))
            this.socket.on('message', this.newMessage.bind(this));
            this.socket.on('room-list', this.setRooms.bind(this));
            this.socket.on('message-list', this.setMessages.bind(this));
            this.socket.on('member-list', this.setMembers.bind(this));
            this.socket.on('joined', this.joinedRoom.bind(this));
            this.socket.on('left', this.leftRoom.bind(this));
        });

        this.socket.on('disconnect', () => {
            this.socket.removeAllListeners('message');
        })
    }

    setUser(user) {
        if (user) {
            this.setState({
                user: user
            });
            this.socket.emit('list-rooms');
        } else {
            this.setState({
                unauthorized: true
            })
        }
        this.socket.emit('list-rooms');
    }

    setRooms(roomList) {
        let rooms = roomList.map((roomName) => {
            return {
                name: roomName,
                messages: [],
                members: []
            }
        })
        this.setState({
            rooms: rooms
        })
        roomList.forEach((roomName) => {
            this.socket.emit('join-room', roomName);
        })
    }

    setMembers(data) {
        let roomName = data.room;
        let roomIndex = this.state.rooms.findIndex(room => room.name === roomName);
        if (roomIndex >= 0) {
            this.setState({
                rooms: update(this.state.rooms, { [roomIndex]: { 'members': { $set: data.members } } })
            })
        }
    }

    setMessages(data) {
        let roomName = data.room;
        let roomIndex = this.state.rooms.findIndex(room => room.name === roomName);
        if (roomIndex >= 0) {
            this.setState({
                rooms: update(this.state.rooms, { [roomIndex]: { 'messages': { $set: data.messages } } })
            })
        }
    }

    joinedRoom (data) {
        this.socket.emit('list-members', data.room);
    }

    leftRoom (data) {
        this.socket.emit('list-members', data.room);
    }

    newMessage(data) {
        let roomName = data.room;
        let roomIndex = this.state.rooms.findIndex(room => room.name === roomName);
        this.setState({
            rooms: update(this.state.rooms, { [roomIndex]: { 'messages': { $push: [data] } } })
        })
    }

    setActiveRoom(e) {
        let room = e.target.textContent;
        this.socket.emit('list-members', room);
        this.socket.emit('list-messages', room);
        this.setState({
            activeRoom: room
        })
    }
    sendMessage() {
        if (this.state.inputMessage) {
            this.socket.emit('message', {
                room: this.state.activeRoom,
                message: this.state.inputMessage
            })
            this.setState({
                inputMessage: ''
            })
        }
    }

    inputKeyPress(e) {
        if (e.key === 'Enter') {
            this.sendMessage();
        }
    }

    inputChange(e) {
        this.setState({
            inputMessage: e.target.value
        })
    }

    renderActiveRoom() {
        let activeRoom = <div></div>
        if (this.state.activeRoom) {
            let room = this.state.rooms.find(_room => {
                return (_room.name === this.state.activeRoom);
            });
            activeRoom =
                <div>
                    <Room username={this.username} name={room.name} messages={room.messages} members={room.members} />
                </div>
        }


        return activeRoom;
    }

    renderRoomNames() {
        let _this = this;
        let roomNames = _this.state.rooms.map((room, index) => {
            let nameClass = 'room-name';
            let memberList = <div></div>
            if (_this.state.activeRoom === room.name) {
                nameClass += ' active';
                memberList = this.renderRoomMemberNames()
            }
            return (
                <div>
                    <div className={nameClass} onClick={this.setActiveRoom.bind(this)}>{room.name}</div>
                    <div>
                        {memberList}
                    </div>
                </div>
            );
        });

        return (
            <div className='room-list'>
                <div className='room-list-title'>Rooms</div>
                {roomNames}
            </div>
        )
    }


    renderRoomMemberNames() {
        let _this = this;
        let activeRoom = _this.state.rooms.find(_room => {
            return (_room.name === _this.state.activeRoom)
        })
        let members = activeRoom.members.map((member, index) => {
            return (<div className='member-name'>{member.username}</div>);
        });
        return (
            <div className='member-list'>
                {members}
            </div>
        )
    }

    render() {
        return (
            <div className='chat'>
                <div className='side-bar'>
                    {this.renderRoomNames()}
                </div>
                <div className='room'>
                    {this.renderActiveRoom()}
                </div>
                <div className='input-box'>
                    <input className='input' type='text'
                        onKeyPress={this.inputKeyPress.bind(this)}
                        onChange={this.inputChange.bind(this)}
                        value={this.state.inputMessage}></input>
                    <button className='send' onClick={this.sendMessage.bind(this)}>Send</button>
                </div>
            </div>
        )
    }
}

export default Rooms;



