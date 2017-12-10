import express from 'express';
import path from 'path';
import http from 'http';
import socketServer from './socket';

const PORT = process.env.PORT || 3000;
const app = express();
app.use(express.static(path.join(__dirname, '../../', 'public')));
const httpServer = http.createServer(app);

httpServer.listen(PORT, '0.0.0.0', () => console.log('Server listening at port ' + PORT));
socketServer(httpServer);
