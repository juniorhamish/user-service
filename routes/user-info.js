const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  res.json({ name: 'Dave' });
});

module.exports = router;
