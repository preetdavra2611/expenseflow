import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { prisma } from '../config';

export class ExportService {
  /**
   * Generates CSV string
   */
  async exportToCSV(userId: string, filters: any = {}): Promise<string> {
    const transactions = await this.getFilteredTransactions(userId, filters);

    const headers = ['Date', 'Type', 'Category', 'Description', 'Merchant', 'Payment Method', 'Amount', 'Currency', 'Notes'];
    const rows = transactions.map((t) => [
      t.transactionDate.toISOString().split('T')[0],
      t.type,
      t.category.name,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      t.paymentMethod,
      t.amount,
      t.currency,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    return csvContent;
  }

  /**
   * Generates Excel (.xlsx) buffer
   */
  async exportToExcel(userId: string, filters: any = {}): Promise<Buffer> {
    const transactions = await this.getFilteredTransactions(userId, filters);

    const data = transactions.map((t) => ({
      Date: t.transactionDate.toISOString().split('T')[0],
      Type: t.type,
      Category: t.category.name,
      Description: t.description,
      Merchant: t.merchant || '',
      'Payment Method': t.paymentMethod,
      Amount: t.amount,
      Currency: t.currency,
      Notes: t.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 18 }, // Category
      { wch: 25 }, // Description
      { wch: 18 }, // Merchant
      { wch: 15 }, // Payment Method
      { wch: 12 }, // Amount
      { wch: 10 }, // Currency
      { wch: 20 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Generates PDF buffer
   */
  async exportToPDF(userId: string, filters: any = {}): Promise<Buffer> {
    const transactions = await this.getFilteredTransactions(userId, filters);
    const user = await prisma.user.findUnique({ where: { id: userId } });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).fillColor('#1e293b').text('Personal Expense Statement', { align: 'left' });
      doc.fontSize(10).fillColor('#64748b').text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, { align: 'left' });
      doc.text(`User: ${user?.name || 'User'} (${user?.email || 'Telegram Account'})`, { align: 'left' });
      doc.moveDown();

      // Summary
      const totalIncome = transactions.filter((t) => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
      const totalExpense = transactions.filter((t) => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
      const balance = totalIncome - totalExpense;

      doc.rect(40, doc.y, 515, 45).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#0f172a').fontSize(11);
      doc.text(`Total Income: ₹${totalIncome.toLocaleString('en-IN')}`, 55, doc.y - 35);
      doc.text(`Total Expenses: ₹${totalExpense.toLocaleString('en-IN')}`, 200, doc.y - 14);
      doc.text(`Net Balance: ₹${balance.toLocaleString('en-IN')}`, 370, doc.y - 14);
      doc.moveDown(2);

      // Table Header
      const tableTop = doc.y + 10;
      doc.rect(40, tableTop, 515, 20).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
      doc.text('Date', 50, tableTop + 6);
      doc.text('Category', 110, tableTop + 6);
      doc.text('Description', 190, tableTop + 6);
      doc.text('Method', 330, tableTop + 6);
      doc.text('Type', 400, tableTop + 6);
      doc.text('Amount (₹)', 460, tableTop + 6, { align: 'right', width: 80 });

      let yPos = tableTop + 24;
      doc.font('Helvetica').fontSize(8);

      // Rows
      for (const t of transactions) {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }

        const isEven = transactions.indexOf(t) % 2 === 0;
        if (isEven) {
          doc.rect(40, yPos - 3, 515, 18).fill('#f1f5f9');
        }

        doc.fillColor('#334155');
        doc.text(t.transactionDate.toISOString().split('T')[0], 50, yPos);
        doc.text(t.category.name, 110, yPos, { width: 75, lineBreak: false });
        doc.text(t.description.slice(0, 24), 190, yPos, { width: 135, lineBreak: false });
        doc.text(t.paymentMethod, 330, yPos);
        
        doc.fillColor(t.type === 'INCOME' ? '#16a34a' : '#dc2626');
        doc.text(t.type, 400, yPos);
        doc.text(`₹${t.amount.toLocaleString('en-IN')}`, 460, yPos, { align: 'right', width: 80 });

        yPos += 18;
      }

      doc.end();
    });
  }

  private async getFilteredTransactions(userId: string, filter: any = {}) {
    const where: any = { userId };
    if (filter.type) where.type = filter.type;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.paymentMethod) where.paymentMethod = filter.paymentMethod;

    if (filter.startDate && filter.endDate) {
      const start = new Date(filter.startDate);
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      where.transactionDate = { gte: start, lte: end };
    }

    return prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { transactionDate: 'desc' },
    });
  }
}

export const exportService = new ExportService();
