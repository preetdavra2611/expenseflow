"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recurringController = exports.RecurringController = void 0;
const recurring_service_1 = require("../services/recurring.service");
const types_1 = require("../types");
class RecurringController {
    async getRecurring(req, res, next) {
        try {
            const items = await recurring_service_1.recurringService.getRecurring(req.user.id);
            res.json({ success: true, recurring: items });
        }
        catch (err) {
            next(err);
        }
    }
    async createRecurring(req, res, next) {
        try {
            const data = types_1.RecurringSchema.parse(req.body);
            const item = await recurring_service_1.recurringService.createRecurring(req.user.id, data);
            res.status(201).json({ success: true, recurring: item });
        }
        catch (err) {
            next(err);
        }
    }
    async updateRecurring(req, res, next) {
        try {
            const { id } = req.params;
            await recurring_service_1.recurringService.updateRecurring(id, req.user.id, req.body);
            res.json({ success: true, message: 'Recurring transaction updated' });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteRecurring(req, res, next) {
        try {
            const { id } = req.params;
            await recurring_service_1.recurringService.deleteRecurring(id, req.user.id);
            res.json({ success: true, message: 'Recurring transaction deleted' });
        }
        catch (err) {
            next(err);
        }
    }
    async processDue(_req, res, next) {
        try {
            const processedCount = await recurring_service_1.recurringService.processDueRecurring();
            res.json({ success: true, processed: processedCount });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RecurringController = RecurringController;
exports.recurringController = new RecurringController();
