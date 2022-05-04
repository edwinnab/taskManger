const express = require('express')
const mongoose = require('./db/mongoose')
const bodyParser = require('body-parser')

//initialize the app, define the port number
const app = express()
const port = 3000;

//require models
const { List, Task } = require('./db/models')

app.use(bodyParser.json());

//CORS MIDDLEWARE FOR EXPRESS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id");

    res.header(
        'Access-Control-Expose-Headers',
        'x-access-token, x-refresh-token'
    );

    next();
});


/*
list routes

1.GET /lists
purpose is to get all lists

2.POST /lists
creates a new list

3.PATCH /lists/:id
updates a specific list

4.DELETE /lists/:id
deletes a specific list
 */

app.get('/lists', (req, res) => {
    //returns all the lists
    List.find({}).then((lists) => {
        res.send(lists)
    })
})

app.post('/lists', (req,res) => {
    //create a new list
    let title = req.body.title;
    let newList = new List({
        title
    });
    //return the document including the id
    newList.save().then((listDoc) => {
        res.send(listDoc)
    })
})

app.patch('/lists/:id', (req, res) => {
    //updates a specific list
    List.findOneAndUpdate({_id: req.params.id}, {  //pass in the condition which is the id
        $set: req.body
    }).then(() => {
        res.sendStatus(200);
    })
})

app.delete('/lists/:id', (req, res) => {
    //deletes a specific list item
    List.findOneAndRemove({_id: req.params.id}).then((removedListDoc) => {
        res.send(removedListDoc)
    })
})

/*
* create routes for the tasks
* GET, /lists/:listId/tasks
* purpose gets all the tasks specific to a list
*
* POST, /lists/:listId/tasks
* purpose creates a new tasks for a specific list
*
*PATCH, /lists/:listId/tasks/:taskId
* updates a specific task to a specific list
*
*DELETE, /lists/:listId/tasks/:taskId
* deletes a specific task from a specific list
*
*  */

app.get('/lists/:listId/tasks', (req, res) => {
    Task.find({_listId: req.params.listId}).then((tasks) => {
        res.send(tasks)
    });
})

app.get('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOne({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((task) => {
        res.send(task)
    })
})


app.post('/lists/:listId/tasks', (req, res) => {
    let newTask = new Task({
        title: req.body.title,
        _listId: req.params.listId
    });
    newTask.save().then((newTaskDoc) => {
        res.send(newTaskDoc)
    });
})

app.patch('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOneAndUpdate({
        _id: req.params.taskId,
        _listId: req.params.listId
    }, {
        $set: req.body
    }).then(() => {
        res.send({message: 'Updated Successfully!!'});
    })
})

app.delete('/lists/:listId/tasks/:taskId', (req, res) => {
    Task.findOneAndRemove({
        _id: req.params.taskId,
        _listId: req.params.listId
    }).then((removedTaskDoc) => {
        res.send(removedTaskDoc)
    })
})



app.listen(port, (req,res)=> {
    console.log(`server listening at port ${port}`)
})