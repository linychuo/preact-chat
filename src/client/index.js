import './style';
import { Component } from 'preact';
import { route, Router } from 'preact-router';
import io from 'socket.io-client';
import { setTimeout } from 'timers';

const TYPING_TIMER_LENGTH = 400; // ms
const socket = io();

const Log = ({ logBody }) => (
	<li class="log" style="display: list-item;">{logBody}</li>
);

const Message = ({ isTyping, userName, messageBody }) => (
	<li class={isTyping ? 'message typing' : 'message'}>
		<span class="username" style="color:#e21400">{userName}</span>
		<span class="messageBody">{messageBody}</span>
	</li>
);

function getParticipantsMessage(data) {
	let message = '';
	if (data.numUsers === 1) {
		message = `there's 1 participant`;
	}
	else {
		message = `there are ${data.numUsers} participant`;
	}
	return { type: 'log', body: message };
}

class ChatPage extends Component {
	appendMessage = (msg) => {
		let messages = this.state.messages;
		if (msg instanceof Array) {
			msg.forEach(item => messages.push(item));
		}
		else {
			messages.push(msg);
		}
		this.setState({ messages });
	}

	onKeyDown = e => {
		if (e.which === 13) {
			let msgBody = e.target.value.trim();
			if (msgBody) {
				e.target.value = '';
				this.appendMessage({
					type: 'message',
					typing: false,
					userName: this.props.settings.userName,
					body: msgBody
				});
				socket.emit('new message', msgBody);
				socket.emit('stop typing');
				this.typing = false;
			}
		}
	}

	onInput = e => {
		if (!this.typing) {
			this.typing = true;
			socket.emit('typing');
		}
		this.lastTypingTime = (new Date()).getTime();

		setTimeout(() => {
			let now = (new Date()).getTime();
			let diff = now - this.lastTypingTime;
			if (diff >= TYPING_TIMER_LENGTH && this.typing) {
				socket.emit('stop typing');
				this.typing = false;
			}
		}, TYPING_TIMER_LENGTH);
	}

	constructor() {
		super();
		this.setState({ messages: [] });
		this.typing = false;
		this.lastTypingTime = 0;
	}

	componentDidMount() {
		document.querySelectorAll('.inputMessage')[0].focus();
		socket.on('login', (data) => {
			this.appendMessage([
				{ type: 'log', body: 'Welcome to Socket.IO Chat – ' },
				getParticipantsMessage(data)
			]);
		});

		socket.on('new message', (data) => {
			this.appendMessage({
				type: 'message',
				isTyping: false,
				userName: data.username,
				body: data.message
			});
		});

		socket.on('user joined', (data) => {
			this.appendMessage([
				{ type: 'log', body: `${data.username} joined` },
				getParticipantsMessage(data)
			]);
		});

		socket.on('user left', (data) => {
			this.appendMessage([
				{ type: 'log', body: `${data.username} left` },
				getParticipantsMessage(data)
			]);
		});

		socket.on('typing', (data) => {
			this.appendMessage({
				type: 'message',
				isTyping: true,
				userName: data.username,
				body: 'is typing'
			});
		});

		socket.on('stop typing', (data) => {
			let messages = this.state.messages;
			for (let i = 0; i < messages.length; i++) {
				let msg = messages[i];
				if (msg.type === 'message' && msg.isTyping && msg.userName === data.username) {
					messages.splice(i, 1);
				}
			}
			this.setState({ messages });
		});

		socket.on('disconnect', () => {
			this.appendMessage({
				type: 'log', body: 'you have been disconnected'
			});
		});

		socket.on('reconnect', () => {
			this.appendMessage({
				type: 'log', body: 'you have been reconnected'
			});
			if (this.props.settings.userName) {
				socket.emit('add user', this.props.settings.userName);
			}
		});

		socket.on('reconnect_error', () => {
			this.appendMessage({
				type: 'log', body: 'attempt to reconnect has failed'
			});
		});
	}

	render({ }, { messages }) {
		return (
			<li class="chat page">
				<div class="chatArea">
					<ul class="messages">
						{
							messages.map(msg => msg.type === 'log' ? <Log logBody={msg.body} /> : <Message userName={msg.userName} isTyping={msg.isTyping} messageBody={msg.body} />)
						}
					</ul>
				</div>
				<input class="inputMessage" placeholder="Type here..." onKeyDown={this.onKeyDown} onInput={this.onInput} />
			</li>
		);
	}
}

class LoginPage extends Component {
	onKeyDown = e => {
		if (e.which === 13) {
			let userName = e.target.value.trim();
			if (userName) {
				this.props.onLogin(userName);
				socket.emit('add user', userName);
				route('/chat');
			}
		}
	}

	componentDidMount() {
		document.querySelectorAll('.usernameInput')[0].focus();
	}

	render() {
		return (
			<li class="login page">
				<div class="form">
					<h3 class="title">What is your nickname?</h3>
					<input class="usernameInput" type="text" maxlength="14" onKeyDown={this.onKeyDown} />
				</div>
			</li>
		);
	}
}

export default class Main extends Component {
	setUserName = (userName) => {
		this.props.userName = userName;
	}

	render() {
		return (
			<ul class="pages">
				<Router>
					<LoginPage path="/" onLogin={this.setUserName} />
					<ChatPage path="/chat" settings={this.props} />
				</Router>
			</ul>
		);
	}
}
