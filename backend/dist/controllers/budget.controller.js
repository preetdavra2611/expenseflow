"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetController = exports.BudgetController = void 0;
const budget_service_1 = require("../services/budget.service");
const types_1 = require("../types");
class BudgetController {
    async getBudgets(req, res, next) {
        try {
            const budgets = await budget_service_1.budgetService.getUserBudgets(req.user.id);
            res.json({ success: true, budgets });
        }
        catch (err) {
            next(err);
        }
    }
    async upsertBudget(req, res, next) {
        try {
            const data = types_1.BudgetSchema.parse(req.body);
            const budget = await budget_service_1.budgetService.upsertBudget(req.user.id, data.categoryId, data.amount, data.period);
            res.status(201).json({ success: true, budget });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteBudget(req, res, next) {
        try {
            const { id } = req.params;
            await budget_service_1.budgetService.deleteBudget(id, req.user.id);
            res.json({ success: true, message: 'Budget removed successfully' });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.BudgetController = BudgetController;
exports.budgetController = new BudgetController();
