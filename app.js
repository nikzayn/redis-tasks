const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const redis = require('redis');

var app = express();

var client = redis.createClient();

client.on('connect', () => {
    console.log('Redis Connected...');
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    var title = 'Task list';

    client.lrange('tasks', 0, -1, (err, reply) => {
        client.hgetall('call', (err, call) => {
            res.render('index', {
                title: title,
                tasks: reply,
                call: call
            });
        });
    });
});

app.post('/tasks/add', (req, res) => {
    var task = req.body.task;
    client.rpush('tasks', task, (err, reply) => {
        if(err){
            console.log(err)
        }
        console.log('task added....');
        res.redirect('/');
    });
});

app.post('/tasks/delete', (req, res) => {
    var tasksToDelete = req.body.tasks;

    client.lrange('tasks', 0, -1, function(err, tasks){
        for(var i = 0; i < tasks.length; i++){
            if(tasksToDelete.indexOf(tasks[i]) > -1){
                client.lrem('tasks', 0, tasks[i], () => {
                    if(err){
                        console.log(err);
                    }
                });
            }
        }
        res.redirect('/');
    });
});


app.post('/call/add', (req, res) => {
    var newCall = {};

    newCall.name = req.body.name;
    newCall.company = req.body.company;
    newCall.phone = req.body.phone;
    newCall.time = req.body.time;

    client.hmset('call', ['name', newCall.name, 'company', newCall.company, 'phone', newCall.phone, 'time', newCall.time], (err, reply) => {
        if(err){
            console.log(err);
        }
        console.log(reply);
        res.redirect('/');
    });
});



app.listen(3000, () => {
    console.log('Server started on port 3000');
});


module.exports = app;