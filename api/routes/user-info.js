const {ManagementClient} = require('auth0');
const express = require('express');
const router = express.Router();

const management = new ManagementClient({
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    domain: process.env.AUTH0_DOMAIN,
});

router.get('/', async function (req, res) {
    const result = await management.users.get({
        id: req.auth.payload.sub,
    });
    const {name, email, given_name, family_name, nickname, picture, user_metadata} = result.data;
    console.log(`Get user info for ${email}`);
    res.json({name, email, given_name, family_name, nickname, picture, user_metadata});
});

module.exports = router;
