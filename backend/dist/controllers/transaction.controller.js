"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionController = exports.TransactionController = void 0;
const transaction_service_1 = require("../services/transaction.service");
const aiParser_service_1 = require("../services/aiParser.service");
const types_1 = require("../types");
class TransactionController {
    async getTransactions(req, res, next) {
        try {
            const { search, categoryId, type, paymentMethod, dateRange, startDate, endDate, page, limit, sortBy, sortOrder, } = req.query;
            const result = await transaction_service_1.transactionService.getTransactions(req.user.id, {
                search: search ? String(search) : undefined,
                categoryId: categoryId ? String(categoryId) : undefined,
                type: type ? String(type) : undefined,
                paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
                dateRange: dateRange ? String(dateRange) : undefined,
                startDate: startDate ? String(startDate) : undefined,
                endDate: endDate ? String(endDate) : undefined,
                page: page ? parseInt(String(page), 10) : 1,
                limit: limit ? parseInt(String(limit), 10) : 20,
                sortBy: sortBy ? String(sortBy) : undefined,
                sortOrder: sortOrder ? String(sortOrder) : undefined,
            });
            res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
    async getTransactionById(req, res, next) {
        try {
            const { id } = req.params;
            const transaction = await transaction_service_1.transactionService.getTransactionById(id, req.user.id);
            if (!transaction) {
                return res.status(404).json({ success: false, message: 'Transaction not found' });
            }
            res.json({ success: true, transaction });
        }
        catch (err) {
            next(err);
        }
    }
    async createTransaction(req, res, next) {
        try {
            const data = types_1.TransactionSchema.parse(req.body);
            const transaction = await transaction_service_1.transactionService.createFromParsed(req.user.id, {
                type: data.type,
                amount: data.amount,
                currency: data.currency,
                category: data.categoryId, // will be resolved
                description: data.description,
                merchant: data.merchant,
                paymentMethod: data.paymentMethod,
                date: data.transactionDate,
                notes: data.notes,
            });
            res.status(201).json({ success: true, ...transaction });
        }
        catch (err) {
            next(err);
        }
    }
    async updateTransaction(req, res, next) {
        try {
            const { id } = req.params;
            const updated = await transaction_service_1.transactionService.updateTransaction(id, req.user.id, req.body);
            res.json({ success: true, transaction: updated });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteTransaction(req, res, next) {
        try {
            const { id } = req.params;
            await transaction_service_1.transactionService.deleteTransaction(id, req.user.id);
            res.json({ success: true, message: 'Transaction deleted successfully' });
        }
        catch (err) {
            next(err);
        }
    }
    async undoTransaction(req, res, next) {
        try {
            const undone = await transaction_service_1.transactionService.undoLatestTransaction(req.user.id);
            if (!undone) {
                return res.status(404).json({ success: false, message: 'No transaction to undo' });
            }
            res.json({ success: true, transaction: undone });
        }
        catch (err) {
            next(err);
        }
    }
    async parseNLP(req, res, next) {
        try {
            const { text } = req.body;
            if (!text) {
                return res.status(400).json({ success: false, message: 'Text is required' });
            }
            const result = await aiParser_service_1.aiParserService.parseMessage(text, req.user.timezone);
            res.json({ success: true, result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.TransactionController = TransactionController;
exports.transactionController = new TransactionController();
