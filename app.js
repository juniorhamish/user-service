const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const userInfoRouter = require('./routes/user-info');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/user-info', userInfoRouter);

module.exports = app;
