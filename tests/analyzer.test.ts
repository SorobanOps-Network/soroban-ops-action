const mockSetFailed = jest.fn();
const mockInfo = jest.fn();
const mockWarning = jest.fn();

jest.mock('@actions/core', () => ({
  setFailed: (...args: any[]) => mockSetFailed(...args),
  info: (...args: any[]) => mockInfo(...args),
  warning: (...args: any[]) => mockWarning(...args)
}), { virtual: true });

import { BudgetAnalyzer, MetricAnalysis } from '../src/analyzer';

describe('BudgetAnalyzer Unit Tests Suite', () => {
  beforeEach(() => {
    mockSetFailed.mockClear();
    mockInfo.mockClear();
    mockWarning.mockClear();
  });

  describe('parseThreshold', () => {
    test('Should parse integer strings correctly', () => {
      expect(BudgetAnalyzer.parseThreshold('15')).toBe(15);
      expect(BudgetAnalyzer.parseThreshold('0')).toBe(0);
    });

    test('Should parse percentage strings correctly', () => {
      expect(BudgetAnalyzer.parseThreshold('15%')).toBe(15);
      expect(BudgetAnalyzer.parseThreshold(' 10.5% ')).toBe(10.5);
    });

    test('Should return undefined for empty or invalid strings', () => {
      expect(BudgetAnalyzer.parseThreshold('')).toBeUndefined();
      expect(BudgetAnalyzer.parseThreshold('   ')).toBeUndefined();
      expect(BudgetAnalyzer.parseThreshold(undefined)).toBeUndefined();
      expect(BudgetAnalyzer.parseThreshold(null)).toBeUndefined();
      expect(BudgetAnalyzer.parseThreshold('not-a-number')).toBeUndefined();
    });
  });

  describe('evaluate', () => {
    const mockReport: Record<string, MetricAnalysis> = {
      cpuInstructions: { current: 11500, baseline: 10000, delta: 1500, percent: '15.00%' },
      memoryBytes: { current: 5000, baseline: 4000, delta: 1000, percent: '25.00%' },
      ledgerReads: { current: 2, baseline: 1, delta: 1, percent: '100.00%' },
      ledgerWrites: { current: 1, baseline: 1, delta: 0, percent: '0.00%' }
    };

    test('Should pass when no thresholds are configured', () => {
      const result = BudgetAnalyzer.evaluate(mockReport, {});
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('Should pass when metric increases are within allowable limits', () => {
      const result = BudgetAnalyzer.evaluate(mockReport, {
        maxCpuIncreasePercent: 20,
        maxMemIncreasePercent: 30
      });
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('Should fail when CPU increase exceeds threshold with exact formatted message', () => {
      const result = BudgetAnalyzer.evaluate(mockReport, {
        maxCpuIncreasePercent: 10
      });
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('CPU limit exceeded: +15% > Max 10%');
    });

    test('Should fail when Memory increase exceeds threshold with exact formatted message', () => {
      const result = BudgetAnalyzer.evaluate(mockReport, {
        maxMemIncreasePercent: 15
      });
      expect(result.passed).toBe(false);
      expect(result.violations).toContain('Memory limit exceeded: +25% > Max 15%');
    });

    test('Should report multiple violations when both thresholds are exceeded', () => {
      const result = BudgetAnalyzer.evaluate(mockReport, {
        maxCpuIncreasePercent: 10,
        maxMemIncreasePercent: 20
      });
      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(2);
      expect(result.violations).toContain('CPU limit exceeded: +15% > Max 10%');
      expect(result.violations).toContain('Memory limit exceeded: +25% > Max 20%');
    });

    test('Should not flag negative deltas (reductions/optimizations) as violations', () => {
      const optimizedReport: Record<string, MetricAnalysis> = {
        cpuInstructions: { current: 8000, baseline: 10000, delta: -2000, percent: '-20.00%' },
        memoryBytes: { current: 3000, baseline: 4000, delta: -1000, percent: '-25.00%' }
      };
      const result = BudgetAnalyzer.evaluate(optimizedReport, {
        maxCpuIncreasePercent: 5,
        maxMemIncreasePercent: 5
      });
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('enforce', () => {
    const passingReport: Record<string, MetricAnalysis> = {
      cpuInstructions: { current: 10500, baseline: 10000, delta: 500, percent: '5.00%' },
      memoryBytes: { current: 4200, baseline: 4000, delta: 200, percent: '5.00%' }
    };

    const failingReport: Record<string, MetricAnalysis> = {
      cpuInstructions: { current: 12000, baseline: 10000, delta: 2000, percent: '20.00%' },
      memoryBytes: { current: 4000, baseline: 4000, delta: 0, percent: '0.00%' }
    };

    test('Should not invoke setFailed when metrics pass', () => {
      const passed = BudgetAnalyzer.enforce(passingReport, { maxCpuIncreasePercent: 10 });
      expect(passed).toBe(true);
      expect(mockSetFailed).not.toHaveBeenCalled();
    });

    test('Should invoke setFailed with violation description when threshold is exceeded', () => {
      const passed = BudgetAnalyzer.enforce(failingReport, { maxCpuIncreasePercent: 10 });
      expect(passed).toBe(false);
      expect(mockSetFailed).toHaveBeenCalledWith('CPU limit exceeded: +20% > Max 10%');
    });
  });
});
