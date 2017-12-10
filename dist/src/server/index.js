'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _socket = require('./socket');

var _socket2 = _interopRequireDefault(_socket);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PORT = process.env.PORT || 3000;
var app = (0, _express2.default)();
app.use(_express2.default.static(_path2.default.join(__dirname, '../../', 'public')));
var httpServer = _http2.default.createServer(app);

httpServer.listen(PORT, '0.0.0.0', function () {
  return console.log('Server listening at port ' + PORT);
});
(0, _socket2.default)(httpServer);