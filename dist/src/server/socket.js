'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

exports.default = function (server) {
	var numUsers = 0;
	(0, _socket2.default)(server).on('connection', function (socket) {
		var addedUser = false;

		socket.on('new message', function (data) {
			socket.broadcast.emit('new message', {
				username: socket.username,
				message: data
			});
		});

		socket.on('add user', function (username) {
			if (addedUser) return;

			socket.username = username;
			++numUsers;
			addedUser = true;
			socket.emit('login', { numUsers: numUsers });

			socket.broadcast.emit('user joined', {
				username: socket.username,
				numUsers: numUsers
			});
		});

		socket.on('typing', function () {
			socket.broadcast.emit('typing', {
				username: socket.username
			});
		});

		socket.on('stop typing', function () {
			socket.broadcast.emit('stop typing', {
				username: socket.username
			});
		});

		socket.on('disconnect', function () {
			if (addedUser) {
				--numUsers;

				socket.broadcast.emit('user left', {
					username: socket.username,
					numUsers: numUsers
				});
			}
		});
	});
};

var _socket = require('socket.io');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }