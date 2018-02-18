import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Rooms from './rooms';

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: '',
      auth: false
    }
  }

  login(e) {
    this.setState({
      auth: true
    })
  }

  keyPress(e) {
    if (e.key === 'Enter') {
      this.login();
    }
  }

  onChange(e) {
    this.setState({
      username: e.target.value
    })
  }
  render() {
    let content = null;
    if (this.state.auth) {
      content =
        <div id='content' className='App-content'>
          <Rooms username={this.state.username} />
        </div>
    } else {
      content =
        <div>
          <input type='text' placeholder='Enter chat name'
            onKeyPress={this.keyPress.bind(this)}
            onChange={this.onChange.bind(this)}
            value={this.state.username}>
          </input>
        </div>
    }

    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        {content}
      </div>
    );
  }
}

export default App;
