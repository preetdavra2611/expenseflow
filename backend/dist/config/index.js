"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '5000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-expense-tracker-production-ready',
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
        usePolling: process.env.TELEGRAM_USE_POLLING === 'true',
    },
    ai: {
        geminiApiKey: process.env.GEMINI_API_KEY || '',
        geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    },
};
exports.prisma = new client_1.PrismaClient();
