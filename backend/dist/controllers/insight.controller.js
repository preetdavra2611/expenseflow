"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insightController = exports.InsightController = void 0;
const insight_service_1 = require("../services/insight.service");
class InsightController {
    async getInsights(req, res, next) {
        try {
            const insights = await insight_service_1.insightService.generateInsights(req.user.id);
            res.json({ success: true, insights });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.InsightController = InsightController;
exports.insightController = new InsightController();
