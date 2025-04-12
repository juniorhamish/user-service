const express = require('express');
const router = express.Router();

router.get('/', function(req, res) {
  console.log('GET /user-info');
  res.json({ name: 'Dave' });
});

module.exports = router;
