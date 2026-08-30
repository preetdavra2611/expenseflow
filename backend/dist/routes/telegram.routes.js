"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const telegram_controller_1 = require("../controllers/telegram.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Telegram Webhook receiver (called by Telegram servers)
router.post('/webhook', telegram_controller_1.telegramController.webhook);
// Telegram Simulator (called from dashboard web app to test bot responses)
router.post('/simulate', auth_middleware_1.authenticateJwt, telegram_controller_1.telegramController.simulate);
exports.default = router;
