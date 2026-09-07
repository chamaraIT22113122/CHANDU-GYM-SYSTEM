import { Router } from 'express';

const router = Router();

// In a real application, these would be stored in the database.
// For now, we will store them in memory.
let globalSettings = {
  gymName: "Chandu Gym",
  email: "admin@chandugym.com",
  phone: "+94 77 123 4567",
  address: "123 Fitness Street, Colombo",
  baseFee: "5000",
  maintenanceFee: "2000",
  penaltyFee: "500",
  emailReminders: true,
  autoSuspend: true,
  twoFactorAuth: false,
  max_capacity: "20"
};

router.get('/', (req, res) => {
  return res.json(globalSettings);
});

router.post('/', (req, res) => {
  globalSettings = { ...globalSettings, ...req.body };
  return res.json({ success: true, settings: globalSettings });
});

export default router;
