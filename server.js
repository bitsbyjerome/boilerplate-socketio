'use strict';
require('dotenv').config();
const express          = require('express');
const session          = require('express-session');
const bodyParser       = require('body-parser');
const fccTesting       = require('./freeCodeCamp/fcctesting.js');
const auth             = require('./auth.js');
const routes           = require('./routes.js');
const mongo            = require('mongodb').MongoClient;
const passport         = require('passport');
const cookieParser     = require('cookie-parser')
const app              = express();
const http             = require('http').Server(app);
const sessionStore     = new session.MemoryStore();
const io               = require('socket.io')(http);
const passportSocketIo = require('passport.socketio');


fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'pug')

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    key: 'express.sid',
    store: sessionStore,
}));

io.use(passportSocketIo.authorize({
    cookieParser: cookieParser,
    key:          'express.sid',
    secret:       process.env.SESSION_SECRET,
    store:        sessionStore
}))

app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE,{ useUnifiedTopology: true }, (err, database) => {
    //let db = dbClient.db('test');
    let db = database.db('test')
    if(err) console.log('Database error: ' + err);
    //console.log('db connected')
    routes(app, db);
    auth(app, db);

    http.listen(process.env.PORT || 3000);

    //start socket.io code

    let currentUsers = 0;

    io.on('connection', socket=>{
        currentUsers++;
        io.emit('user', {name:socket.request.user.name, currentUsers, connected:true});
        //console.log(socket.request);

        console.log('user '+ socket.request.user.name +' connected');

        socket.on('disconnect', ()=>{
            currentUsers--;
            io.emit('usercount', currentUsers);
            console.log('a user is disconnected');
        })

        socket.on('chat message', (data)=>{
            //console.log('message: '+ message)
            io.emit('chat message', {name:socket.request.user.name, message:data});
        });

    });



    //end socket.io code
});