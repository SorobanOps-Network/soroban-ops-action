import * as core from '@actions/core';

export interface BudgetThresholds {
  maxCpuIncreasePercent?: number;
  maxMemIncreasePercent?: number;
}

export interface MetricAnalysis {
  current: number;
  baseline: number;
  delta: number;
  percent: string;
}

export interface EvaluationResult {
  passed: boolean;
  violations: string[];
}

export class BudgetAnalyzer {
  /**
   * Parses raw threshold string (supports formats like "15", "15%", "15.5%") into a number.
   * Returns undefined if input is missing, empty, or unparseable.
   */
  public static parseThreshold(value?: string | null): number | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    const trimmed = value.trim();
    if (trimmed === '') {
      return undefined;
    }
    const sanitized = trimmed.replace('%', '').trim();
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Evaluates calculated resource deltas against configured budget thresholds.
   *
   * @param analysis Detailed delta report per metric
   * @param thresholds Optional percentage thresholds for CPU and Memory increases
   * @returns EvaluationResult containing pass status and formatted violation strings
   */
  public static evaluate(
    analysis: Record<string, MetricAnalysis>,
    thresholds: BudgetThresholds
  ): EvaluationResult {
    const violations: string[] = [];

    const getPercentShift = (metricData: MetricAnalysis): number => {
      if (metricData.baseline > 0) {
        return ((metricData.current - metricData.baseline) / metricData.baseline) * 100;
      }
      return parseFloat(metricData.percent) || 0;
    };

    const formatPercent = (val: number): string => {
      const rounded = Math.round(val * 100) / 100;
      const formatted = Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(2)}%`;
      return rounded > 0 ? `+${formatted}` : formatted;
    };

    // 1. Evaluate CPU Instructions threshold
    if (
      thresholds.maxCpuIncreasePercent !== undefined &&
      thresholds.maxCpuIncreasePercent !== null &&
      !isNaN(thresholds.maxCpuIncreasePercent)
    ) {
      const cpuData = analysis['cpuInstructions'] || analysis['cpu_instructions'];
      if (cpuData) {
        const cpuShift = getPercentShift(cpuData);
        if (cpuShift > thresholds.maxCpuIncreasePercent) {
          violations.push(
            `CPU limit exceeded: ${formatPercent(cpuShift)} > Max ${thresholds.maxCpuIncreasePercent}%`
          );
        }
      }
    }

    // 2. Evaluate Memory Bytes threshold
    if (
      thresholds.maxMemIncreasePercent !== undefined &&
      thresholds.maxMemIncreasePercent !== null &&
      !isNaN(thresholds.maxMemIncreasePercent)
    ) {
      const memData = analysis['memoryBytes'] || analysis['memory_bytes'];
      if (memData) {
        const memShift = getPercentShift(memData);
        if (memShift > thresholds.maxMemIncreasePercent) {
          violations.push(
            `Memory limit exceeded: ${formatPercent(memShift)} > Max ${thresholds.maxMemIncreasePercent}%`
          );
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }

  /**
   * Evaluates thresholds and triggers @actions/core.setFailed() if any violations occur.
   *
   * @param analysis Detailed delta report per metric
   * @param thresholds Optional percentage thresholds for CPU and Memory increases
   * @returns boolean true if budget limits passed, false if exceeded
   */
  public static enforce(
    analysis: Record<string, MetricAnalysis>,
    thresholds: BudgetThresholds
  ): boolean {
    const result = this.evaluate(analysis, thresholds);

    if (!result.passed) {
      for (const violation of result.violations) {
        core.setFailed(violation);
      }
      return false;
    }

    core.info('Resource budget thresholds verification passed successfully.');
    return true;
  }
}
