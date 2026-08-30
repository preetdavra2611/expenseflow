import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { config, prisma } from './config';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { telegramService } from './services/telegram.service';
import { recurringService } from './services/recurring.service';

const app = express();

// Middlewares
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root API Welcome
app.get('/', (_req, res) => {
  res.json({
    name: '⚡ ExpenseFlow Backend API',
    status: 'online',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api: '/api',
    },
  });
});

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
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

// Cron Job: Process recurring transactions every day at midnight (and on server start)
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Running daily recurring transactions processor...');
  try {
    const processed = await recurringService.processDueRecurring();
    console.log(`✅ Processed ${processed} recurring transactions.`);
  } catch (err) {
    console.error('Error processing recurring transactions:', err);
  }
});

// Server Initialization
const server = app.listen(config.port, async () => {
  console.log(`🚀 Expense Tracker Backend running on port ${config.port} (${config.nodeEnv})`);
  console.log(`🔗 API Base: http://localhost:${config.port}/api`);

  // Run initial recurring transactions check
  try {
    const dueCount = await recurringService.processDueRecurring();
    if (dueCount > 0) {
      console.log(`🔁 Processed ${dueCount} due recurring transactions on startup.`);
    }
  } catch (err) {
    console.warn('Initial recurring check notice:', err);
  }

  // Telegram Bot setup
  if (config.telegram.botToken) {
    if (config.telegram.usePolling) {
      telegramService.startPolling();
    } else if (config.telegram.webhookUrl) {
      await telegramService.setupWebhook(config.telegram.webhookUrl);
    } else {
      console.log('ℹ️ Telegram Bot Token provided. Set TELEGRAM_USE_POLLING=true for local dev or TELEGRAM_WEBHOOK_URL for production.');
    }
  } else {
    console.log('ℹ️ No TELEGRAM_BOT_TOKEN provided. Telegram Simulator is enabled in Web Dashboard for instant testing!');
  }
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('🛑 Gracefully shutting down...');
  telegramService.stopPolling();
  server.close(async () => {
    await prisma.$disconnect();
    console.log('👋 Server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

export default app;
