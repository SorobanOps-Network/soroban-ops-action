import * as fs from 'fs';
import * as path from 'path';
import * as core from '@actions/core';
import { GasMetrics } from './parser/gasParser';

export interface TelemetryDeltaMetric {
  current: number;
  baseline: number;
  delta: number;
  percent: string;
}

export interface GasReportTelemetry {
  timestamp: string;
  schemaVersion: string;
  metrics: {
    current: GasMetrics;
    baseline: GasMetrics;
    deltas: Record<string, TelemetryDeltaMetric>;
  };
}

export class GasExporter {
  /**
   * Formats gas metrics and comparative deltas into a standardized JSON telemetry payload,
   * writes the file to the workspace, and registers the output step path.
   */
  public static exportReport(
    current: GasMetrics,
    baseline: GasMetrics,
    deltas: Record<string, TelemetryDeltaMetric>,
    outputPath: string = 'soroban-gas-report.json'
  ): string {
    const telemetryPayload: GasReportTelemetry = {
      timestamp: new Date().toISOString(),
      schemaVersion: '1.0.0',
      metrics: {
        current,
        baseline,
        deltas
      }
    };

    const resolvedPath = path.resolve(process.cwd(), outputPath);
    const directory = path.dirname(resolvedPath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(resolvedPath, JSON.stringify(telemetryPayload, null, 2), 'utf-8');
    core.setOutput('report-json-path', resolvedPath);
    core.info(`Successfully exported telemetry JSON report to: ${resolvedPath}`);

    return resolvedPath;
  }
}
