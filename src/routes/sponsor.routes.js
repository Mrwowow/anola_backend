const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Sponsor routes - Coming soon' });
});

module.exports = router;