const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const serverIndex = require('serve-index');
const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash')
const NodeCache = require( "node-cache" );
const myCache = new NodeCache();

myCache.set('sockets', [])

const client = new MongoClient('mongodb://localhost:27017', {
	useUnifiedTopology: true,
	auth: {
		user: process.env.MongoDB_username,
		password: process.env.MongoDB_pw
	}
});

client.connect(function (err) {
	if (!err) {
		console.log('Connected successfully to server');
	}
});

// var log4js = require("log4js");

// log4js.configure({
// 	appenders: [{
// 	  type: 'file',
// 	  filename: 'default.log'
// 	}]
// })

// var logger = log4js.getLogger();
// logger.level = "debug";

// Configure & Run the http server
const app = express();

const privateKey = fs.readFileSync('/etc/letsencrypt/live/likaiqianglearn.cn/privkey.pem');

const certificate = fs.readFileSync('/etc/letsencrypt/live/likaiqianglearn.cn/cert.pem');

const ca = fs.readFileSync('/etc/letsencrypt/live/likaiqianglearn.cn/chain.pem');

const credentials = {
	key: privateKey,
	cert: certificate,
	ca: ca
};

app.use(express.static('./public', { dotfiles: 'allow' }));

app.use(serverIndex('./public'));

// app.use((req, res) => {
// 	res.send('Hello there !');
// });
app.get('/api/getChartList', (req, res) => {
	const db = client.db('chart');
	const collection = db.collection('data');

	collection.find({
		room: req.query.id
	}).toArray().then(list => {
		res.send(list)
	})
})

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

const io = require('socket.io')(httpsServer);

httpServer.listen(80, () => {
	console.log('HTTP Server running on port 80');
});

httpsServer.listen(443, () => {
	console.log('HTTPS Server running on port 443');
});

io.on('connection', (socket) => {
	socket.on('join', (room, username) => {
		const caches = _.cloneDeep(myCache.get('sockets'))
		const index = caches.findIndex(s => s.username === username && s.room === room)
		if (index === -1) {
			if(caches.length >=2){
				socket.emit('full')
			}
			else {
				caches.push({
					room,
					username,
					id: socket.id
				})
			}
		}
		else {
			//前一个id应该leave
			io.in(caches[index]).socketsLeave(room);
			caches[index].id = socket.id
		}
		myCache.set('sockets', caches)

		socket.join(room)
		
		socket.on('message', data => {
			const db = client.db('chart');
			const collection = db.collection('data');

			collection.insertOne({
				room,
				socket_id: socket.id,
				data
			})
			io.in(room).emit('broadcast', data) //给房间内所有人广播事件，包括自己
		})
		socket.on('local-candidate', (e) => {
			socket.to(room).emit('local-candidate-from-server', e) //给房间其他用户发offer，不包括自己
		})
		socket.on('remote-candidate', (e) => {
			// io.to(id).emit('remote-candidate-from-server', e)
			socket.to(room).emit('remote-candidate-from-server',e)
		})
		socket.on('desc', (e) => {
			if (e.type === 'offer') {
				socket.to(room).emit('offer-from-server', e)
			}
			else {
				// io.to(id).emit('answer-from-server',e)
				socket.to(room).emit('answer-from-server',e)
			}
		})
		socket.on('close-video',e=>{
			socket.to(room).emit('close-video-from-server',e)
		})
		socket.to(room).emit('other-joined', {
			room,
			id: socket.id,
			username
		})
		socket.emit('joined', {
			room,
			id: socket.id,
			username
		})

	})
	socket.on('leave', (room, username) => {
		socket.leave(room)
		const cache = myCache.get('sockets')
		const index = cache.findIndex(s => s.room === room && s.username === username)
		if (index > -1) {
			cache.splice(index, 1)
			myCache.set('sockets', cache)
		}
	})
})
