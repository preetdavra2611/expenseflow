import { Response, NextFunction } from 'express';
import { exportService } from '../services/export.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ExportController {
  async exportCSV(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await exportService.exportToCSV(req.user.id, req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.csv"`);
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }

  async exportExcel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const buffer = await exportService.exportToExcel(req.user.id, req.query);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="transactions_${Date.now()}.xlsx"`);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  async exportPDF(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await exportService.exportToPDF(req.user.id, req.query);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="statement_${Date.now()}.pdf"`);
      res.send(pdfBuffer);
    } catch (err) {
      next(err);
    }
  }
}

export const exportController = new ExportController();
