const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Example merch route
app.get('/api/merch', (req, res) => {
  res.json([
    { id: 1, name: "Canada Day T-Shirt", price: 25.00 },
    { id: 2, name: "Canadian Flag Hat", price: 15.00 },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
