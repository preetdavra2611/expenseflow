"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.telegramService = exports.TelegramService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const aiParser_service_1 = require("./aiParser.service");
const auth_service_1 = require("./auth.service");
const transaction_service_1 = require("./transaction.service");
class TelegramService {
    botToken;
    baseUrl;
    isPollingActive = false;
    lastUpdateId = 0;
    constructor() {
        this.botToken = config_1.config.telegram.botToken;
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
    /**
     * Set up Telegram Webhook
     */
    async setupWebhook(webhookUrl) {
        if (!this.botToken)
            return false;
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/setWebhook`, {
                url: webhookUrl,
                allowed_updates: ['message', 'callback_query'],
            });
            console.log('Telegram Webhook configured:', res.data);
            return res.data.ok;
        }
        catch (err) {
            console.error('Failed to set Telegram webhook:', err?.response?.data || err.message);
            return false;
        }
    }
    /**
     * Start long-polling in development
     */
    async startPolling() {
        if (!this.botToken || this.isPollingActive)
            return;
        this.isPollingActive = true;
        console.log('🤖 Starting Telegram long-polling listener...');
        // Clear any active webhook to allow getUpdates
        try {
            await axios_1.default.post(`${this.baseUrl}/deleteWebhook`, { drop_pending_updates: false });
            console.log('✅ Cleared Telegram webhook for polling.');
        }
        catch (e) {
            console.warn('⚠️ deleteWebhook notice:', e?.response?.data || e.message);
        }
        const poll = async () => {
            if (!this.isPollingActive)
                return;
            try {
                const res = await axios_1.default.get(`${this.baseUrl}/getUpdates`, {
                    params: {
                        offset: this.lastUpdateId + 1,
                        timeout: 20,
                    },
                });
                if (res.data.ok && Array.isArray(res.data.result)) {
                    for (const update of res.data.result) {
                        this.lastUpdateId = update.update_id;
                        console.log(`📩 Telegram Update #${update.update_id} received:`, update.message?.text || update.callback_query?.data);
                        await this.processUpdate(update);
                    }
                }
            }
            catch (err) {
                console.error('❌ Telegram polling error:', err?.response?.data || err.message);
                if (this.isPollingActive) {
                    // Wait 3 seconds on error before polling again
                    await new Promise((r) => setTimeout(r, 3000));
                }
            }
            if (this.isPollingActive) {
                setTimeout(poll, 500);
            }
        };
        poll();
    }
    stopPolling() {
        this.isPollingActive = false;
    }
    /**
     * Processes an incoming Telegram update (from Webhook or Polling) with strict idempotency
     */
    async processUpdate(update) {
        const updateIdStr = String(update.update_id);
        // 1. Idempotency Check: Prevent duplicate webhook retries
        const existingUpdate = await config_1.prisma.telegramUpdate.findUnique({
            where: { updateId: updateIdStr },
        });
        if (existingUpdate) {
            return { handled: true };
        }
        // 2. Record update ID
        await config_1.prisma.telegramUpdate.create({
            data: { updateId: updateIdStr },
        });
        // 3. Handle Callback Queries (Inline Button clicks)
        if (update.callback_query) {
            return this.handleCallbackQuery(update.callback_query);
        }
        // 4. Handle Text Messages
        if (update.message && update.message.text) {
            return this.handleTextMessage(update.message);
        }
        return { handled: false };
    }
    /**
     * Handle text messages and commands
     */
    async handleTextMessage(msg) {
        const chatId = msg.chat.id;
        const telegramUserId = String(msg.from.id);
        const username = msg.from.username;
        const fullName = [msg.from.first_name, msg.from.last_name].filter(Boolean).join(' ');
        const text = msg.text.trim();
        // Find or create the user in DB
        const user = await auth_service_1.authService.getOrCreateTelegramUser(telegramUserId, username, fullName);
        // Command Handlers
        if (text.startsWith('/')) {
            const [cmd, ...args] = text.split(' ');
            const lowerCmd = cmd.toLowerCase().split('@')[0];
            switch (lowerCmd) {
                case '/start':
                    return this.handleStartCommand(chatId, user, telegramUserId, username, args);
                case '/help':
                    return this.handleHelpCommand(chatId);
                case '/summary':
                    return this.handleSummaryCommand(chatId, user.id);
                case '/today':
                    return this.handleTodayCommand(chatId, user.id);
                case '/month':
                    return this.handleMonthCommand(chatId, user.id);
                case '/categories':
                    return this.handleCategoriesCommand(chatId, user.id);
                case '/undo':
                    return this.handleUndoCommand(chatId, user.id);
                case '/recent':
                    return this.handleRecentCommand(chatId, user.id);
                case '/link':
                    return this.handleLinkCommand(chatId, telegramUserId, username, args);
                default:
                    await this.sendMessage(chatId, `Unknown command ${cmd}. Type /help to see all available commands.`);
                    return { handled: true };
            }
        }
        // Natural Language Expense / Income Parsing
        return this.processNaturalLanguageMessage(chatId, user, text, String(msg.message_id));
    }
    /**
     * Natural Language Processing Flow
     */
    async processNaturalLanguageMessage(chatId, user, text, telegramMessageId) {
        const parseResult = await aiParser_service_1.aiParserService.parseMessage(text, user.timezone);
        if (parseResult.status === 'FAILED') {
            const errorReply = `❌ Sorry, I couldn't understand that.\n\nTry sending something like:\n• \`Spent 250 on dinner\`\n• \`₹500 petrol\`\n• \`Salary 40000 received\`\n• \`150 chai\`\n\nType /help for more examples.`;
            await this.sendMessage(chatId, errorReply, { parse_mode: 'Markdown' });
            return { handled: true, replyText: errorReply };
        }
        if (parseResult.status === 'CLARIFICATION') {
            const { clarification } = parseResult;
            // Store clarification context in DB for this user
            await config_1.prisma.telegramUpdate.create({
                data: {
                    updateId: `clarify_${user.id}_${Date.now()}`,
                    userId: user.id,
                    pendingClarification: JSON.stringify(clarification),
                },
            });
            // Build inline buttons for the suggested categories
            const inlineKeyboard = clarification.options.map((opt) => [
                {
                    text: opt,
                    callback_data: `cat_${opt}_${clarification.extractedAmount || 0}_${clarification.extractedType || 'EXPENSE'}`,
                },
            ]);
            const questionText = `🤔 ${clarification.question}`;
            await this.sendMessage(chatId, questionText, {
                reply_markup: { inline_keyboard: inlineKeyboard },
            });
            return { handled: true, replyText: questionText };
        }
        // Success with 1 or more transactions
        const { transactions } = parseResult;
        if (transactions.length === 1) {
            const item = transactions[0];
            const { transaction, budgetAlert, categoryTotalMonth } = await transaction_service_1.transactionService.createFromParsed(user.id, item, telegramMessageId);
            const symbol = user.currencySymbol || '₹';
            const isIncome = item.type === 'INCOME';
            const icon = isIncome ? '💵' : '🍔';
            let reply = isIncome
                ? `✅ *Income added*\n\n💰 *${symbol}${item.amount.toLocaleString('en-IN')}*\n💼 *Category:* ${item.category}\n📝 *Description:* ${item.description}\n📅 *Date:* ${item.date}`
                : `✅ *Expense added*\n\n💰 *${symbol}${item.amount.toLocaleString('en-IN')}*\n${icon} *Category:* ${item.category}\n📝 *Description:* ${item.description}\n🏪 *Merchant:* ${item.merchant || 'Not specified'}\n💳 *Payment:* ${item.paymentMethod}\n📅 *Date:* ${item.date}\n\n📊 *Monthly ${item.category} spending:* ${symbol}${categoryTotalMonth.toLocaleString('en-IN')}`;
            if (budgetAlert) {
                reply += `\n\n${budgetAlert}`;
            }
            const buttonRow = [{ text: '🗑️ Undo', callback_data: `undo_${transaction.id}` }];
            if (config_1.config.clientUrl && config_1.config.clientUrl.startsWith('https://')) {
                buttonRow.push({ text: '📊 Dashboard', url: config_1.config.clientUrl });
            }
            await this.sendMessage(chatId, reply, {
                parse_mode: 'Markdown',
                reply_markup: { inline_keyboard: [buttonRow] },
            });
            return { handled: true, replyText: reply };
        }
        // Multiple Transactions
        const results = await transaction_service_1.transactionService.createMultipleParsed(user.id, transactions, telegramMessageId);
        const symbol = user.currencySymbol || '₹';
        const total = transactions.reduce((acc, t) => acc + t.amount, 0);
        let summaryText = `✅ *Added ${transactions.length} transactions*\n\n`;
        for (const t of transactions) {
            const emoji = t.type === 'INCOME' ? '💵' : '💳';
            summaryText += `${emoji} *${t.description}* — ${symbol}${t.amount.toLocaleString('en-IN')} (${t.category})\n`;
        }
        summaryText += `\n🔢 *Total:* ${symbol}${total.toLocaleString('en-IN')}`;
        await this.sendMessage(chatId, summaryText, { parse_mode: 'Markdown' });
        return { handled: true, replyText: summaryText };
    }
    /**
     * Handle Callback Queries (Button Clicks)
     */
    async handleCallbackQuery(cb) {
        const data = cb.data;
        const chatId = cb.message?.chat?.id;
        const telegramUserId = String(cb.from.id);
        const user = await auth_service_1.authService.getOrCreateTelegramUser(telegramUserId);
        if (data.startsWith('undo_') || data.startsWith('del_')) {
            const txId = data.replace(/^(undo_|del_)/, '');
            await transaction_service_1.transactionService.deleteTransaction(txId, user.id);
            await this.answerCallbackQuery(cb.id, 'Transaction deleted successfully ✅');
            if (chatId && cb.message?.message_id) {
                await this.editMessageText(chatId, cb.message.message_id, `🗑️ *Transaction removed.*`, {
                    parse_mode: 'Markdown',
                });
            }
            return { handled: true };
        }
        if (data.startsWith('cat_')) {
            // Format: cat_CategoryName_Amount_Type
            const parts = data.split('_');
            const categoryName = parts[1];
            const amount = parseFloat(parts[2]) || 0;
            const type = (parts[3] || 'EXPENSE');
            if (amount > 0) {
                const { transaction, categoryTotalMonth } = await transaction_service_1.transactionService.createFromParsed(user.id, {
                    type,
                    amount,
                    currency: 'INR',
                    category: categoryName,
                    description: categoryName,
                    paymentMethod: 'CASH',
                    date: new Date().toISOString().split('T')[0],
                });
                await this.answerCallbackQuery(cb.id, `Saved as ${categoryName}!`);
                const symbol = user.currencySymbol || '₹';
                const reply = `✅ *Expense added*\n\n💰 *${symbol}${amount}*\n📁 *Category:* ${categoryName}\n📊 *Monthly total:* ${symbol}${categoryTotalMonth}`;
                if (chatId && cb.message?.message_id) {
                    await this.editMessageText(chatId, cb.message.message_id, reply, {
                        parse_mode: 'Markdown',
                        reply_markup: {
                            inline_keyboard: [[{ text: '🗑️ Undo', callback_data: `undo_${transaction.id}` }]],
                        },
                    });
                }
            }
            return { handled: true };
        }
        await this.answerCallbackQuery(cb.id);
        return { handled: true };
    }
    // Command Implementations
    async handleStartCommand(chatId, user, telegramUserId, username, args) {
        // If deep link parameter is provided (e.g. /start link_<userId> or /start <userId>)
        if (args && args.length > 0 && telegramUserId) {
            const rawTarget = args[0].replace(/^link_/, '').trim();
            const targetUser = await config_1.prisma.user.findFirst({
                where: {
                    OR: [{ id: rawTarget }, { email: rawTarget }],
                },
            });
            if (targetUser) {
                await auth_service_1.authService.linkTelegramAccount(targetUser.id, telegramUserId, username);
                user = targetUser;
            }
        }
        const linkedStatus = user.email
            ? `✅ *Linked Account:* \`${user.email}\``
            : `🔗 *Web Dashboard Link:* Send \`/link your-email@example.com\` to link with your web dashboard.`;
        const welcome = `👋 *Welcome to ExpenseTracker Bot, ${user.name}!*

${linkedStatus}

Track your daily expenses and income effortlessly in natural language. Just send what you spent and I'll organize it instantly!

💡 *Quick Examples:*
• \`Spent 250 on dinner\`
• \`₹500 petrol\`
• \`Bought clothes for 1800 yesterday\`
• \`150 chai\`
• \`Spent 750 on groceries at Dmart\`
• \`₹120 Uber to college\`
• \`Paid 12000 rent\`
• \`Today I spent 350 on food and 200 on transport\`
• \`Got salary 35000\`
• \`Received 5000 from dad\`

📱 *Web Dashboard:* [Open Dashboard](${config_1.config.clientUrl})
Type /help for the full list of commands.`;
        const keyboard = [];
        if (config_1.config.clientUrl && config_1.config.clientUrl.startsWith('https://')) {
            keyboard.push([{ text: '📊 Open Web Dashboard', url: config_1.config.clientUrl }]);
        }
        keyboard.push([{ text: '⚡ Help & Commands', callback_data: 'help_cmd' }]);
        await this.sendMessage(chatId, welcome, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: keyboard,
            },
        });
        return { handled: true, replyText: welcome };
    }
    async handleHelpCommand(chatId) {
        const help = `📖 *ExpenseTracker Bot Commands:*

/start - Restart & view introduction
/help - Show this guide
/summary - Today's spending & overall balance
/today - List of today's transactions
/month - Current month breakdown
/categories - Monthly category spending
/undo - Revert your last recorded transaction
/recent - View last 10 transactions

💬 *Natural Language Support:*
You can type in English, Indian English, or Hinglish:
• \`200 kharch kiye food pe\`
• \`aaj 500 petrol\`
• \`mom gave me 2000\`
• \`salary 40000 received\`
• \`₹500 shopping via UPI\`
• \`350 on dinner at Domino's yesterday using UPI\``;
        await this.sendMessage(chatId, help, { parse_mode: 'Markdown' });
        return { handled: true, replyText: help };
    }
    async handleSummaryCommand(chatId, userId) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const [todayExpenses, allTx] = await Promise.all([
            config_1.prisma.transaction.aggregate({
                where: {
                    userId,
                    type: 'EXPENSE',
                    transactionDate: { gte: startOfToday, lte: endOfToday },
                },
                _sum: { amount: true },
            }),
            config_1.prisma.transaction.groupBy({
                by: ['type'],
                where: { userId },
                _sum: { amount: true },
            }),
        ]);
        const todaySpent = todayExpenses._sum.amount || 0;
        let totalIncome = 0;
        let totalExpense = 0;
        for (const item of allTx) {
            if (item.type === 'INCOME')
                totalIncome = item._sum.amount || 0;
            if (item.type === 'EXPENSE')
                totalExpense = item._sum.amount || 0;
        }
        const balance = totalIncome - totalExpense;
        const summary = `📊 *Financial Summary*

📅 *Today's Spending:* ₹${todaySpent.toLocaleString('en-IN')}
📈 *Total Income:* ₹${totalIncome.toLocaleString('en-IN')}
📉 *Total Expenses:* ₹${totalExpense.toLocaleString('en-IN')}
💰 *Remaining Balance:* ₹${balance.toLocaleString('en-IN')}`;
        await this.sendMessage(chatId, summary, { parse_mode: 'Markdown' });
        return { handled: true, replyText: summary };
    }
    async handleTodayCommand(chatId, userId) {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const transactions = await config_1.prisma.transaction.findMany({
            where: {
                userId,
                transactionDate: { gte: startOfToday, lte: endOfToday },
            },
            include: { category: true },
            orderBy: { transactionDate: 'desc' },
        });
        if (transactions.length === 0) {
            const msg = `📅 No transactions recorded today yet.\nSend an expense like \`Spent 150 on coffee\` to get started!`;
            await this.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            return { handled: true, replyText: msg };
        }
        let text = `📅 *Today's Transactions:*\n\n`;
        let totalToday = 0;
        for (const t of transactions) {
            const icon = t.type === 'INCOME' ? '💵' : '🍔';
            text += `${icon} *${t.description}* — ₹${t.amount.toLocaleString('en-IN')} (${t.category.name})\n`;
            if (t.type === 'EXPENSE')
                totalToday += t.amount;
        }
        text += `\n*Total Spent Today:* ₹${totalToday.toLocaleString('en-IN')}`;
        await this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        return { handled: true, replyText: text };
    }
    async handleMonthCommand(chatId, userId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const monthTx = await config_1.prisma.transaction.findMany({
            where: {
                userId,
                transactionDate: { gte: startOfMonth, lte: endOfMonth },
            },
            include: { category: true },
        });
        const expenses = monthTx.filter((t) => t.type === 'EXPENSE');
        const income = monthTx.filter((t) => t.type === 'INCOME');
        const totalExpense = expenses.reduce((acc, t) => acc + t.amount, 0);
        const totalIncome = income.reduce((acc, t) => acc + t.amount, 0);
        const categoryMap = {};
        for (const e of expenses) {
            categoryMap[e.category.name] = (categoryMap[e.category.name] || 0) + e.amount;
        }
        const sorted = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
        let text = `🗓️ *${now.toLocaleString('default', { month: 'long', year: 'numeric' })} Summary*\n\n`;
        text += `📈 *Income:* ₹${totalIncome.toLocaleString('en-IN')}\n`;
        text += `📉 *Expenses:* ₹${totalExpense.toLocaleString('en-IN')}\n`;
        text += `💰 *Net Savings:* ₹${(totalIncome - totalExpense).toLocaleString('en-IN')}\n\n`;
        text += `🏆 *Top Categories:*\n`;
        for (const [cat, amt] of sorted.slice(0, 5)) {
            text += `• ${cat}: ₹${amt.toLocaleString('en-IN')}\n`;
        }
        await this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        return { handled: true, replyText: text };
    }
    async handleCategoriesCommand(chatId, userId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const expenses = await config_1.prisma.transaction.findMany({
            where: {
                userId,
                type: 'EXPENSE',
                transactionDate: { gte: startOfMonth, lte: endOfMonth },
            },
            include: { category: true },
        });
        const catTotals = {};
        let total = 0;
        for (const e of expenses) {
            catTotals[e.category.name] = (catTotals[e.category.name] || 0) + e.amount;
            total += e.amount;
        }
        if (total === 0) {
            const msg = `📁 No category spending recorded this month yet.`;
            await this.sendMessage(chatId, msg);
            return { handled: true, replyText: msg };
        }
        let text = `📁 *Spending by Category (This Month):*\n\n`;
        for (const [cat, amt] of Object.entries(catTotals).sort((a, b) => b[1] - a[1])) {
            const pct = Math.round((amt / total) * 100);
            text += `• *${cat}:* ₹${amt.toLocaleString('en-IN')} (${pct}%)\n`;
        }
        text += `\n*Total:* ₹${total.toLocaleString('en-IN')}`;
        await this.sendMessage(chatId, text, { parse_mode: 'Markdown' });
        return { handled: true, replyText: text };
    }
    async handleUndoCommand(chatId, userId) {
        const deleted = await transaction_service_1.transactionService.undoLatestTransaction(userId);
        if (!deleted) {
            const msg = `ℹ️ No transactions to undo.`;
            await this.sendMessage(chatId, msg);
            return { handled: true, replyText: msg };
        }
        const reply = `↩️ *Undid latest transaction:*\n\n🗑️ ${deleted.description} — ₹${deleted.amount.toLocaleString('en-IN')} (${deleted.category?.name || 'Category'})`;
        await this.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
        return { handled: true, replyText: reply };
    }
    async handleRecentCommand(chatId, userId) {
        const recent = await config_1.prisma.transaction.findMany({
            where: { userId },
            orderBy: { transactionDate: 'desc' },
            take: 10,
            include: { category: true },
        });
        if (recent.length === 0) {
            const msg = `ℹ️ No recent transactions found.`;
            await this.sendMessage(chatId, msg);
            return { handled: true, replyText: msg };
        }
        let text = `🕒 *Latest 10 Transactions:*\n\n`;
        const keyboard = [];
        for (const t of recent) {
            const icon = t.type === 'INCOME' ? '💵' : '🍔';
            const dateStr = t.transactionDate.toISOString().split('T')[0];
            text += `${icon} *${t.description}* — ₹${t.amount.toLocaleString('en-IN')} (${t.category.name}) on ${dateStr}\n`;
            keyboard.push([
                { text: `🗑️ Delete: ${t.description.slice(0, 15)} (₹${t.amount})`, callback_data: `del_${t.id}` },
            ]);
        }
        await this.sendMessage(chatId, text, {
            parse_mode: 'Markdown',
            reply_markup: { inline_keyboard: keyboard.slice(0, 5) },
        });
        return { handled: true, replyText: text };
    }
    async handleLinkCommand(chatId, telegramUserId, username, args) {
        const email = args[0]?.trim();
        if (!email) {
            const msg = `🔗 *Link Your Web Account*\n\nPlease provide your registered email:\n\`\`\`/link your-email@example.com\`\`\`\n\nOnce linked, all your Telegram expenses will instantly appear on your dashboard!`;
            await this.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            return { handled: true, replyText: msg };
        }
        const webUser = await config_1.prisma.user.findFirst({
            where: { email: { equals: email } },
        });
        if (!webUser) {
            const msg = `❌ No registered account found with email *${email}*.\nPlease check the email or sign up on the web dashboard first!`;
            await this.sendMessage(chatId, msg, { parse_mode: 'Markdown' });
            return { handled: true, replyText: msg };
        }
        await auth_service_1.authService.linkTelegramAccount(webUser.id, telegramUserId, username);
        const successMsg = `🎉 *Account Successfully Linked!*\n\nConnected to: *${webUser.name}* (${webUser.email})\nAll transactions you send here will now synchronize automatically with your web dashboard!`;
        await this.sendMessage(chatId, successMsg, { parse_mode: 'Markdown' });
        return { handled: true, replyText: successMsg };
    }
    // Telegram API HTTP Call Wrappers
    async sendMessage(chatId, text, options = {}) {
        if (!this.botToken) {
            return { ok: true, simulated: true };
        }
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/sendMessage`, {
                chat_id: chatId,
                text,
                ...options,
            });
            return res.data;
        }
        catch (err) {
            console.error('⚠️ Telegram sendMessage error:', err?.response?.data || err.message);
            // Fallback 1: Retry without reply_markup if button was invalid
            if (options.reply_markup) {
                try {
                    const stripped = { ...options };
                    delete stripped.reply_markup;
                    const retry = await axios_1.default.post(`${this.baseUrl}/sendMessage`, {
                        chat_id: chatId,
                        text,
                        ...stripped,
                    });
                    return retry.data;
                }
                catch (e2) {
                    console.warn('⚠️ Telegram sendMessage stripped retry notice:', e2?.response?.data || e2.message);
                }
            }
            // Fallback 2: Retry with plain text without formatting
            try {
                const plainText = text.replace(/[*_`\[\]()]/g, '');
                const retryPlain = await axios_1.default.post(`${this.baseUrl}/sendMessage`, {
                    chat_id: chatId,
                    text: plainText,
                });
                return retryPlain.data;
            }
            catch (e3) {
                console.error('❌ Final sendMessage fallback error:', e3?.response?.data || e3.message);
            }
            return { ok: false, error: err.message };
        }
    }
    async editMessageText(chatId, messageId, text, options = {}) {
        if (!this.botToken)
            return { ok: true, simulated: true };
        try {
            const res = await axios_1.default.post(`${this.baseUrl}/editMessageText`, {
                chat_id: chatId,
                message_id: messageId,
                text,
                ...options,
            });
            return res.data;
        }
        catch (err) {
            console.error('Telegram editMessageText error:', err?.response?.data || err.message);
        }
    }
    async answerCallbackQuery(callbackQueryId, text) {
        if (!this.botToken)
            return;
        try {
            await axios_1.default.post(`${this.baseUrl}/answerCallbackQuery`, {
                callback_query_id: callbackQueryId,
                text,
            });
        }
        catch (err) {
            console.error('Telegram answerCallbackQuery error:', err?.response?.data || err.message);
        }
    }
}
exports.TelegramService = TelegramService;
exports.telegramService = new TelegramService();
