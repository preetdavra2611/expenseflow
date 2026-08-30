import { aiParserService } from '../src/services/aiParser.service';

describe('AI & Rule-Based Expense Parser Test Suite', () => {
  describe('1. Single Expense Parsing', () => {
    it('should parse "Spent 250 on dinner"', () => {
      const res = aiParserService.parseWithLocalNLP('Spent 250 on dinner');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        expect(res.transactions).toHaveLength(1);
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(250);
        expect(t.category).toBe('Food');
        expect(t.currency).toBe('INR');
      }
    });

    it('should parse "₹500 petrol"', () => {
      const res = aiParserService.parseWithLocalNLP('₹500 petrol');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(500);
        expect(t.category).toBe('Fuel');
      }
    });

    it('should parse "150 chai"', () => {
      const res = aiParserService.parseWithLocalNLP('150 chai');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(150);
        expect(t.category).toBe('Food');
      }
    });

    it('should parse "Spent 750 on groceries at Dmart"', () => {
      const res = aiParserService.parseWithLocalNLP('Spent 750 on groceries at Dmart');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(750);
        expect(t.category).toBe('Groceries');
        expect(t.merchant).toBe('DMart');
      }
    });

    it('should parse "₹120 Uber to college"', () => {
      const res = aiParserService.parseWithLocalNLP('₹120 Uber to college');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(120);
        expect(t.category).toBe('Transport');
        expect(t.merchant).toBe('Uber');
      }
    });

    it('should parse "Paid 12000 rent"', () => {
      const res = aiParserService.parseWithLocalNLP('Paid 12000 rent');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(12000);
        expect(t.category).toBe('Rent');
      }
    });

    it('should parse "Spent 350 on dinner at Domino\'s yesterday using UPI"', () => {
      const res = aiParserService.parseWithLocalNLP("Spent 350 on dinner at Domino's yesterday using UPI");
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(350);
        expect(t.category).toBe('Food');
        expect(t.merchant).toBe("Domino's");
        expect(t.paymentMethod).toBe('UPI');
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        expect(t.date).toBe(yesterday.toISOString().split('T')[0]);
      }
    });
  });

  describe('2. Income Parsing', () => {
    it('should parse "Got salary 35000"', () => {
      const res = aiParserService.parseWithLocalNLP('Got salary 35000');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('INCOME');
        expect(t.amount).toBe(35000);
        expect(t.category).toBe('Salary');
      }
    });

    it('should parse "Received 5000 from dad"', () => {
      const res = aiParserService.parseWithLocalNLP('Received 5000 from dad');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('INCOME');
        expect(t.amount).toBe(5000);
        expect(t.category).toBe('Gift');
      }
    });

    it('should parse "mom gave me 2000"', () => {
      const res = aiParserService.parseWithLocalNLP('mom gave me 2000');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('INCOME');
        expect(t.amount).toBe(2000);
        expect(t.category).toBe('Gift');
      }
    });

    it('should parse "salary 40000 received"', () => {
      const res = aiParserService.parseWithLocalNLP('salary 40000 received');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('INCOME');
        expect(t.amount).toBe(40000);
        expect(t.category).toBe('Salary');
      }
    });
  });

  describe('3. Informal Indian-English / Hinglish Phrasing', () => {
    it('should parse "200 kharch kiye food pe"', () => {
      const res = aiParserService.parseWithLocalNLP('200 kharch kiye food pe');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(200);
        expect(t.category).toBe('Food');
      }
    });

    it('should parse "aaj 500 petrol"', () => {
      const res = aiParserService.parseWithLocalNLP('aaj 500 petrol');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(500);
        expect(t.category).toBe('Fuel');
      }
    });

    it('should parse "paid 1000 for electricity"', () => {
      const res = aiParserService.parseWithLocalNLP('paid 1000 for electricity');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(1000);
        expect(t.category).toBe('Bills & Utilities');
      }
    });

    it('should parse "spent 300 on movie"', () => {
      const res = aiParserService.parseWithLocalNLP('spent 300 on movie');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        const t = res.transactions[0];
        expect(t.type).toBe('EXPENSE');
        expect(t.amount).toBe(300);
        expect(t.category).toBe('Entertainment');
      }
    });
  });

  describe('4. Multiple Transactions in Single Message', () => {
    it('should parse "Today I spent 200 on breakfast, 150 on bus and 500 on shopping"', () => {
      const res = aiParserService.parseWithLocalNLP('Today I spent 200 on breakfast, 150 on bus and 500 on shopping');
      expect(res.status).toBe('SUCCESS');
      if (res.status === 'SUCCESS') {
        expect(res.transactions.length).toBeGreaterThanOrEqual(2);
        const amounts = res.transactions.map((t) => t.amount);
        expect(amounts).toContain(200);
        expect(amounts).toContain(150);
        expect(amounts).toContain(500);
      }
    });
  });

  describe('5. Ambiguous Message Handling', () => {
    it('should ask for clarification on pure number "500"', () => {
      const res = aiParserService.parseWithLocalNLP('500');
      expect(res.status).toBe('CLARIFICATION');
      if (res.status === 'CLARIFICATION') {
        expect(res.clarification.extractedAmount).toBe(500);
        expect(res.clarification.question).toContain('500');
      }
    });
  });
});
