const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
console.log('MONGODB_URI: ', process.env.MONGODB_URI);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp');

module.exports = {
    mongoose,
};
