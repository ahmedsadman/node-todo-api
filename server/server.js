const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const { ObjectID } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT || 3000;
app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
    const todo = new Todo({
        text: req.body.text,
        _creator: req.user._id,
    });

    todo.save()
        .then((doc) => {
            res.send(doc);
        })
        .catch((error) => {
            res.status(400).send(error);
        });
});

app.get('/todos', authenticate, (req, res) => {
    Todo.find({ _creator: req.user._id })
        .then((todos) => {
            res.send({ todos });
        })
        .catch((error) => {
            res.status(400).send(error);
        });
});

app.get('/todos/:id', authenticate, (req, res) => {
    console.log('hi');
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findOne({ _id: id, _creator: req.user._id })
        .then((todo) => {
            if (!todo) {
                res.status(404).send();
            }
            res.send({ todo });
        })
        .catch((err) => {
            res.status(400).send();
        });
});

app.delete('/todos/:id', authenticate, (req, res) => {
    const { id } = req.params;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Todo.findOneAndRemove({ _id: id, _creator: req.user._id })
        .then((todo) => {
            if (!todo) return res.status(404).send();
            res.send(todo);
        })
        .catch(err => res.status(400).send(err));
});

app.patch('/todos/:id', authenticate, (req, res) => {
    const { id } = req.params;
    const body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
        body.hi = 'hi';
    } else {
        body.completed = false;
        body.completedAt = null;
    }

    Todo.findOneAndUpdate(
        {
            _id: id,
            _creator: req.user._id,
        },
        {
            $set: {
                ...body,
            },
        },
        {
            new: true,
        },
    )
        .then((todo) => {
            if (!todo) {
                return res.status(404);
            }
            res.send({ todo });
        })
        .catch((e) => {
            res.status(400).send();
        });
});

app.post('/users', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);

    user.save()
        .then(() => user.generateAuthToken())
        .then((token) => {
            console.log(token);
            res.header('x-auth', token).send(user);
        })
        .catch((e) => {
            res.status(400).send(e);
        });
});

app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});

app.post('/users/login', (req, res) => {
    const body = _.pick(req.body, ['email', 'password']);
    User.findByCredentials(body.email, body.password)
        .then(user => user.generateAuthToken().then((token) => {
            res.header('x-auth', token).send(user);
        }))
        .catch((e) => {
            res.status(400).send();
        });
});

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user
        .removeToken(req.token)
        .then(() => res.send())
        .catch(e => res.status(400).send());
});

// ------------- SERVER SETTINGS -------------
app.listen(port, () => {
    console.log(`Started on port ${port}...`);
});

module.exports = {
    app,
};
