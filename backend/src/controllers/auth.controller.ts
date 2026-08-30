import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  currency: z.string().default('INR'),
  timezone: z.string().default('Asia/Kolkata'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const UpdateSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().optional(),
  currencySymbol: z.string().optional(),
  timezone: z.string().optional(),
  telegramUserId: z.string().optional(),
  telegramUsername: z.string().optional(),
});

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = RegisterSchema.parse(req.body);
      const result = await authService.register(data.email, data.password, data.name, data.currency, data.timezone);
      res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = LoginSchema.parse(req.body);
      const result = await authService.login(data.email, data.password);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const user = authService.sanitizeUser(req.user);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = UpdateSettingsSchema.parse(req.body);
      const updated = await authService.updateSettings(req.user.id, data);
      res.json({ success: true, user: updated });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
