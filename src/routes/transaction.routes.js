const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Transaction routes - Coming soon' });
});

module.exports = router;