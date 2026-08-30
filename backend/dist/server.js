"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("./config");
const routes_1 = __importDefault(require("./routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const telegram_service_1 = require("./services/telegram.service");
const recurring_service_1 = require("./services/recurring.service");
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)({
    origin: '*',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
app.get('/health', (_req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        service: 'telegram-expense-tracker-backend',
    });
});
// API Routes
app.use('/api', routes_1.default);
// Global Error Handler
app.use(error_middleware_1.errorHandler);
// Cron Job: Process recurring transactions every day at midnight (and on server start)
node_cron_1.default.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily recurring transactions processor...');
    try {
        const processed = await recurring_service_1.recurringService.processDueRecurring();
        console.log(`✅ Processed ${processed} recurring transactions.`);
    }
    catch (err) {
        console.error('Error processing recurring transactions:', err);
    }
});
// Server Initialization
const server = app.listen(config_1.config.port, async () => {
    console.log(`🚀 Expense Tracker Backend running on port ${config_1.config.port} (${config_1.config.nodeEnv})`);
    console.log(`🔗 API Base: http://localhost:${config_1.config.port}/api`);
    // Run initial recurring transactions check
    try {
        const dueCount = await recurring_service_1.recurringService.processDueRecurring();
        if (dueCount > 0) {
            console.log(`🔁 Processed ${dueCount} due recurring transactions on startup.`);
        }
    }
    catch (err) {
        console.warn('Initial recurring check notice:', err);
    }
    // Telegram Bot setup
    if (config_1.config.telegram.botToken) {
        if (config_1.config.telegram.usePolling) {
            telegram_service_1.telegramService.startPolling();
        }
        else if (config_1.config.telegram.webhookUrl) {
            await telegram_service_1.telegramService.setupWebhook(config_1.config.telegram.webhookUrl);
        }
        else {
            console.log('ℹ️ Telegram Bot Token provided. Set TELEGRAM_USE_POLLING=true for local dev or TELEGRAM_WEBHOOK_URL for production.');
        }
    }
    else {
        console.log('ℹ️ No TELEGRAM_BOT_TOKEN provided. Telegram Simulator is enabled in Web Dashboard for instant testing!');
    }
});
// Graceful Shutdown
const shutdown = async () => {
    console.log('🛑 Gracefully shutting down...');
    telegram_service_1.telegramService.stopPolling();
    server.close(async () => {
        await config_1.prisma.$disconnect();
        console.log('👋 Server closed.');
        process.exit(0);
    });
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
exports.default = app;
