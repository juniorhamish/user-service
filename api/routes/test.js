const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
    res.json({ name: 'Test' });
});

module.exports = router;
