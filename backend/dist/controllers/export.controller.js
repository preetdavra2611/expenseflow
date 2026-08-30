"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportController = exports.ExportController = void 0;
const export_service_1 = require("../services/export.service");
class ExportController {
    async exportCSV(req, res, next) {
        try {
            const csv = await export_service_1.exportService.exportToCSV(req.user.id, req.query);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.csv"`);
            res.send(csv);
        }
        catch (err) {
            next(err);
        }
    }
    async exportExcel(req, res, next) {
        try {
            const buffer = await export_service_1.exportService.exportToExcel(req.user.id, req.query);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.xlsx"`);
            res.send(buffer);
        }
        catch (err) {
            next(err);
        }
    }
    async exportPDF(req, res, next) {
        try {
            const pdfBuffer = await export_service_1.exportService.exportToPDF(req.user.id, req.query);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="statement_${Date.now()}.pdf"`);
            res.send(pdfBuffer);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.ExportController = ExportController;
exports.exportController = new ExportController();
