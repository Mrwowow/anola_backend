const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Sponsorship routes - Coming soon' });
});

module.exports = router;