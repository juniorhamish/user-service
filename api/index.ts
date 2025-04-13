require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const userInfoRouter = require('./routes/user-info');
const { auth } = require('express-oauth2-jwt-bearer');

const jwtCheck = auth({
    audience: 'https://user-service.dajohnston.co.uk',
    issuerBaseURL: 'https://dajohnston.eu.auth0.com/',
    tokenSigningAlg: 'RS256'
});

const app = express();

app.use(jwtCheck);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Routes
app.use('/user-info', userInfoRouter);

const port = process.env.PORT || '3000';
app.listen(port, () => console.log(`Listening on port ${port}`));

module.exports = app;
