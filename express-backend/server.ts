import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from './lib/db';

dotenv.config();

import authRoutes from './routes/auth';
import membersRoutes from './routes/members';
import plansRoutes from './routes/plans';
import attendanceRoutes from './routes/attendance';
import bookingsRoutes from './routes/bookings';
import billingRoutes from './routes/billing';
import paymentsRoutes from './routes/payments';
import reportsRoutes from './routes/reports';
import dashboardRoutes from './routes/dashboard';
import instructorsRoutes from './routes/instructors';
import settingsRoutes from './routes/settings';
import exercisesRoutes from './routes/exercises';
import notificationsRoutes from './routes/notifications';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());
import path from 'path';
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Routes
app.use('/api/auth', authRoutes); 
app.use('/api/members', membersRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/instructors', instructorsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/exercises', exercisesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Example API route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Express backend is running' });
});

// Setup Admin
app.get('/api/setup', async (req, res) => {
  try {
    const adminExistsResult = await db.query('SELECT * FROM "User" WHERE role = $1', ['ADMIN']);
    const adminExists = adminExistsResult.rows[0];

    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists.' });
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const insertText = `
      INSERT INTO "User" (
        id, email, password, "firstName", "lastName", role, phone, "joinDate", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW()
      ) RETURNING email
    `;
    const insertValues = [
      crypto.randomUUID(),
      'admin@chandugym.com',
      hashedPassword,
      'System',
      'Admin',
      'ADMIN',
      '0000000000'
    ];
    const adminResult = await db.query(insertText, insertValues);

    res.json({ 
      message: 'Admin created successfully.',
      email: adminResult.rows[0].email
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to setup admin' });
  }
});

if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
