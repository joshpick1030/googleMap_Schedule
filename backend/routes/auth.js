const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { token } = req.body;

  // TODO: Validate Google token properly with Firebase/Google API
  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }

  // // Fake response for now
  // res.json({
  //   success: true,
  //   user: {
  //     name: "Test User",
  //     email: "test@example.com",
  //     googleId: "1234567890"
  //   }
  // });

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, picture, sub } = payload;
    
    res.json({
      success: true,
      user: {
        name,
        email,
        picture,
        googleId: sub
      }
    });
  } catch (err) {
    res.status(401).json({message: "Invalid token"});
  }
});

module.exports = router;
