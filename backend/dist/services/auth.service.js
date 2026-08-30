"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const DEFAULT_EXPENSE_CATEGORIES = [
    { name: 'Food', icon: 'Utensils', color: '#f97316' },
    { name: 'Groceries', icon: 'ShoppingCart', color: '#10b981' },
    { name: 'Transport', icon: 'Car', color: '#3b82f6' },
    { name: 'Fuel', icon: 'Fuel', color: '#ef4444' },
    { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899' },
    { name: 'Entertainment', icon: 'Film', color: '#8b5cf6' },
    { name: 'Bills & Utilities', icon: 'Zap', color: '#eab308' },
    { name: 'Rent', icon: 'Home', color: '#6366f1' },
    { name: 'Education', icon: 'GraduationCap', color: '#06b6d4' },
    { name: 'Healthcare', icon: 'HeartPulse', color: '#14b8a6' },
    { name: 'Travel', icon: 'Plane', color: '#f59e0b' },
    { name: 'Subscriptions', icon: 'Tv', color: '#a855f7' },
    { name: 'Personal Care', icon: 'Sparkles', color: '#d946ef' },
    { name: 'Gifts', icon: 'Gift', color: '#f43f5e' },
    { name: 'Other', icon: 'MoreHorizontal', color: '#64748b' },
];
const DEFAULT_INCOME_CATEGORIES = [
    { name: 'Salary', icon: 'Briefcase', color: '#22c55e' },
    { name: 'Freelance', icon: 'Laptop', color: '#0ea5e9' },
    { name: 'Business', icon: 'Building2', color: '#8b5cf6' },
    { name: 'Gift', icon: 'Gift', color: '#ec4899' },
    { name: 'Refund', icon: 'RefreshCw', color: '#10b981' },
    { name: 'Other', icon: 'MoreHorizontal', color: '#64748b' },
];
class AuthService {
    async register(email, password, name, currency = 'INR', timezone = 'Asia/Kolkata') {
        const existing = await config_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            throw new Error('User already exists with this email');
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await config_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                currency,
                currencySymbol: currency === 'INR' ? '₹' : '$',
                timezone,
            },
        });
        // Seed default categories for this user
        await this.seedUserDefaultCategories(user.id);
        const token = this.generateToken(user.id);
        return { user: this.sanitizeUser(user), token };
    }
    async login(email, password) {
        const user = await config_1.prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            throw new Error('Invalid email or password');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }
        const token = this.generateToken(user.id);
        return { user: this.sanitizeUser(user), token };
    }
    async getOrCreateTelegramUser(telegramUserId, telegramUsername, name) {
        const cleanUsername = telegramUsername ? telegramUsername.replace(/^@/, '').trim().toLowerCase() : null;
        // 1. Check if user already exists by telegramUserId
        let user = await config_1.prisma.user.findUnique({
            where: { telegramUserId },
        });
        if (user) {
            if (cleanUsername && user.telegramUsername !== cleanUsername) {
                user = await config_1.prisma.user.update({
                    where: { id: user.id },
                    data: { telegramUsername: cleanUsername },
                });
            }
            return user;
        }
        // 2. Check if an existing registered user matches by telegramUsername or email prefix
        if (cleanUsername) {
            const existingWebUser = await config_1.prisma.user.findFirst({
                where: {
                    OR: [
                        { telegramUsername: { equals: cleanUsername } },
                        { email: { startsWith: cleanUsername } },
                    ],
                },
            });
            if (existingWebUser) {
                user = await config_1.prisma.user.update({
                    where: { id: existingWebUser.id },
                    data: {
                        telegramUserId,
                        telegramUsername: cleanUsername,
                    },
                });
                return user;
            }
        }
        // 3. Otherwise create new user
        user = await config_1.prisma.user.create({
            data: {
                name: name || (cleanUsername ? `@${cleanUsername}` : `Telegram User ${telegramUserId.slice(-4)}`),
                telegramUserId,
                telegramUsername: cleanUsername || null,
                currency: 'INR',
                currencySymbol: '₹',
                timezone: 'Asia/Kolkata',
            },
        });
        await this.seedUserDefaultCategories(user.id);
        return user;
    }
    async linkTelegramAccount(userId, telegramUserId, telegramUsername) {
        const cleanUsername = telegramUsername ? telegramUsername.replace(/^@/, '').trim().toLowerCase() : null;
        // Check if another temporary user holds this telegramUserId
        const existingTemp = await config_1.prisma.user.findUnique({
            where: { telegramUserId },
        });
        if (existingTemp && existingTemp.id !== userId) {
            // Migrate transactions from temporary user to this user
            const targetFoodCat = await config_1.prisma.category.findFirst({
                where: { userId, name: 'Food' },
            });
            const tempCats = await config_1.prisma.category.findMany({ where: { userId: existingTemp.id } });
            for (const tc of tempCats) {
                const matching = await config_1.prisma.category.findFirst({ where: { userId, name: tc.name } });
                const newCatId = matching ? matching.id : (targetFoodCat?.id || tc.id);
                await config_1.prisma.transaction.updateMany({
                    where: { categoryId: tc.id },
                    data: { userId, categoryId: newCatId },
                });
            }
            await config_1.prisma.category.deleteMany({ where: { userId: existingTemp.id } });
            await config_1.prisma.user.delete({ where: { id: existingTemp.id } });
        }
        return config_1.prisma.user.update({
            where: { id: userId },
            data: {
                telegramUserId,
                telegramUsername: cleanUsername || null,
            },
        });
    }
    async updateSettings(userId, data) {
        const cleanUsername = data.telegramUsername ? data.telegramUsername.replace(/^@/, '').trim().toLowerCase() : null;
        if (cleanUsername) {
            // If a temporary telegram user with this username exists, link their telegramUserId
            const tempUser = await config_1.prisma.user.findFirst({
                where: {
                    telegramUsername: { equals: cleanUsername },
                    id: { not: userId },
                },
            });
            if (tempUser && tempUser.telegramUserId) {
                return this.linkTelegramAccount(userId, tempUser.telegramUserId, cleanUsername);
            }
        }
        const user = await config_1.prisma.user.update({
            where: { id: userId },
            data: {
                ...data,
                telegramUsername: cleanUsername || null,
            },
        });
        return this.sanitizeUser(user);
    }
    async seedUserDefaultCategories(userId) {
        for (const c of DEFAULT_EXPENSE_CATEGORIES) {
            await config_1.prisma.category.upsert({
                where: {
                    userId_name_type: {
                        userId,
                        name: c.name,
                        type: 'EXPENSE',
                    },
                },
                create: {
                    userId,
                    name: c.name,
                    type: 'EXPENSE',
                    icon: c.icon,
                    color: c.color,
                    isDefault: true,
                },
                update: {},
            });
        }
        for (const c of DEFAULT_INCOME_CATEGORIES) {
            await config_1.prisma.category.upsert({
                where: {
                    userId_name_type: {
                        userId,
                        name: c.name,
                        type: 'INCOME',
                    },
                },
                create: {
                    userId,
                    name: c.name,
                    type: 'INCOME',
                    icon: c.icon,
                    color: c.color,
                    isDefault: true,
                },
                update: {},
            });
        }
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId }, config_1.config.jwtSecret, { expiresIn: '30d' });
    }
    verifyToken(token) {
        return jsonwebtoken_1.default.verify(token, config_1.config.jwtSecret);
    }
    sanitizeUser(user) {
        const { password, ...safe } = user;
        return safe;
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
