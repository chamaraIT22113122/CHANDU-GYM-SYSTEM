import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth';
import db from '../lib/db';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await db.query('SELECT * FROM "User" WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    let isPasswordValid = false;
    
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } else {
      isPasswordValid = user.password === password;
      if (isPasswordValid) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const responseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: true, // MUST be true for sameSite: 'none'
      sameSite: 'none', // Allow cross-domain cookies
      maxAge: 60 * 60 * 24 * 1000, 
      path: '/',
    });

    return res.json({ user: responseUser });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/member-login', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "Please enter your Member ID or NIC" });
    }

    const result = await db.query(
      'SELECT * FROM "User" WHERE role = $1 AND ("membershipId" = $2 OR nic = $2)',
      ['MEMBER', identifier]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid Member ID or NIC" });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    const responseUser = {
      id: user.id,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 24 * 1000,
      path: "/",
    });

    return res.json({ success: true, user: responseUser });
  } catch (error) {
    console.error("Member login error:", error);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies?.auth_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    
    const { verifyToken } = require('../lib/auth');
    const decoded = verifyToken(token);
    if (!decoded) return res.status(401).json({ error: 'Invalid token' });
    
    return res.json({ user: decoded });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to verify auth' });
  }
});

export default router;
