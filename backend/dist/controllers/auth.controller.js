"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(2),
    currency: zod_1.z.string().default('INR'),
    timezone: zod_1.z.string().default('Asia/Kolkata'),
});
const LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
const UpdateSettingsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    currency: zod_1.z.string().optional(),
    currencySymbol: zod_1.z.string().optional(),
    timezone: zod_1.z.string().optional(),
    telegramUserId: zod_1.z.string().optional(),
    telegramUsername: zod_1.z.string().optional(),
});
class AuthController {
    async register(req, res, next) {
        try {
            const data = RegisterSchema.parse(req.body);
            const result = await auth_service_1.authService.register(data.email, data.password, data.name, data.currency, data.timezone);
            res.status(201).json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    async login(req, res, next) {
        try {
            const data = LoginSchema.parse(req.body);
            const result = await auth_service_1.authService.login(data.email, data.password);
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    async me(req, res, next) {
        try {
            const user = auth_service_1.authService.sanitizeUser(req.user);
            res.json({ success: true, user });
        }
        catch (err) {
            next(err);
        }
    }
    async updateSettings(req, res, next) {
        try {
            const data = UpdateSettingsSchema.parse(req.body);
            const updated = await auth_service_1.authService.updateSettings(req.user.id, data);
            res.json({ success: true, user: updated });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
