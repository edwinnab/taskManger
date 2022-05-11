const express = require('express')
const mongoose = require('./db/mongoose')
const bodyParser = require('body-parser')

//initialize the app, define the port number
const app = express()
const port = 3000;

//require models
const { List, Task, User } = require('./db/models')
const {response} = require("express");
const {next} = require("lodash/seq");

app.use(bodyParser.json());

// Verify Refresh Token Middleware (which will be verifying the session)
let verifySession = (req, res, next) => {
    // grab the refresh token from the request header
    let refreshToken = req.header('x-refresh-token');

    // grab the _id from the request header
    let _id = req.header('_id');

    User.findByIdAndToken(_id, refreshToken).then((user) => {
        if (!user) {
            // user couldn't be found
            return Promise.reject({
                'error': 'User not found. Make sure that the refresh token and user id are correct'
            });
        }


        // if the code reaches here - the user was found
        // therefore the refresh token exists in the database - but we still have to check if it has expired or not

        req.user_id = user._id;
        req.userObject = user;
        req.refreshToken = refreshToken;

        let isSessionValid = false;

        user.sessions.forEach((session) => {
            if (session.token === refreshToken) {
                // check if the session has expired
                if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                    // refresh token has not expired
                    isSessionValid = true;
                }
            }
        });

        if (isSessionValid) {
            // the session is VALID - call next() to continue with processing this web request
            next();
        } else {
            // the session is not valid
            return Promise.reject({
                'error': 'Refresh token has expired or the session is invalid'
            })
        }

    }).catch((e) => {
        res.status(401).send(e);
    })
}


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

/*
create routes for users
POST /users
purpose is to signup users
 */
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we generate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})


/*
login route
POST /users/login
purpose is login
 */
app.post('/users/login', (req, res) => {
    let email = req.body.email;
    let password = req.body.password;

    User.findByCredentials(email, password).then((user) => {
        return user.createSession().then((refreshToken) => {
            // Session created successfully - refreshToken returned.
            // now we generate an access auth token for the user

            return user.generateAccessAuthToken().then((accessToken) => {
                // access auth token generated successfully, now we return an object containing the auth tokens
                return { accessToken, refreshToken }
            });
        }).then((authTokens) => {
            // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
            res
                .header('x-refresh-token', authTokens.refreshToken)
                .header('x-access-token', authTokens.accessToken)
                .send(user);
        })
    }).catch((e) => {
        res.status(400).send(e);
    });
})

/**
 * GET /users/me/access-token
 * Purpose: generates and returns an access token
 */
app.get('/users/me/access-token', verifySession, (req, res) => {
    //user/caller is authenticated the user_id and user object available to us
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})


app.listen(port, (req,res)=> {
    console.log(`server listening at port ${port}`)
})