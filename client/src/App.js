import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import SocketTest from './socket-test';

class App extends Component {
  render() {
    return (
      <div className="App">
        {/* <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header> */}
        <div id = 'content' className = 'content'>
          <SocketTest username = 'test user'/>
        </div>
      </div>
    );
  }
}

export default App;
