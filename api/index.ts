const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const userInfoRouter = require('./routes/user-info');
const testRouter = require('./routes/test');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.use('/user-info', userInfoRouter);
app.use('/test', testRouter);

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
