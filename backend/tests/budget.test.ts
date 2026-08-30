describe('Budget Calculations & Threshold Alerts Test Suite', () => {
  it('should correctly calculate percentage used and warnings', () => {
    const budgetAmount = 10000;

    const calculateWarning = (spent: number) => {
      const pct = Math.round((spent / budgetAmount) * 100);
      let level = 'NORMAL';
      if (pct >= 100) level = 'EXCEEDED_100';
      else if (pct >= 90) level = 'WARNING_90';
      else if (pct >= 75) level = 'WARNING_75';
      return { pct, level, remaining: Math.max(0, budgetAmount - spent) };
    };

    expect(calculateWarning(5000)).toEqual({ pct: 50, level: 'NORMAL', remaining: 5000 });
    expect(calculateWarning(7500)).toEqual({ pct: 75, level: 'WARNING_75', remaining: 2500 });
    expect(calculateWarning(9200)).toEqual({ pct: 92, level: 'WARNING_90', remaining: 800 });
    expect(calculateWarning(10500)).toEqual({ pct: 105, level: 'EXCEEDED_100', remaining: 0 });
  });
});
