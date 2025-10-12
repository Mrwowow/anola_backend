const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Patient routes - Coming soon' });
});

module.exports = router;