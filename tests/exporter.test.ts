import * as fs from 'fs';
import * as path from 'path';
import { GasExporter, TelemetryDeltaMetric } from '../src/exporter';
import { GasMetrics } from '../src/parser/gasParser';

describe('GasExporter Telemetry Unit Tests', () => {
  const testOutputPath = 'test-gas-report.json';

  afterEach(() => {
    const resolved = path.resolve(process.cwd(), testOutputPath);
    if (fs.existsSync(resolved)) {
      fs.unlinkSync(resolved);
    }
  });

  test('Should export structured gas metrics into valid JSON file', () => {
    const current: GasMetrics = { cpuInstructions: 15000, memoryBytes: 5000, ledgerReads: 2, ledgerWrites: 1 };
    const baseline: GasMetrics = { cpuInstructions: 10000, memoryBytes: 4000, ledgerReads: 1, ledgerWrites: 1 };
    const deltas: Record<string, TelemetryDeltaMetric> = {
      cpuInstructions: { current: 15000, baseline: 10000, delta: 5000, percent: "50.00%" },
      memoryBytes: { current: 5000, baseline: 4000, delta: 1000, percent: "25.00%" },
      ledgerReads: { current: 2, baseline: 1, delta: 1, percent: "100.00%" },
      ledgerWrites: { current: 1, baseline: 1, delta: 0, percent: "0.00%" }
    };

    const exportedPath = GasExporter.exportReport(current, baseline, deltas, testOutputPath);
    expect(fs.existsSync(exportedPath)).toBe(true);

    const fileContent = JSON.parse(fs.readFileSync(exportedPath, 'utf-8'));
    expect(fileContent.schemaVersion).toBe('1.0.0');
    expect(fileContent.metrics.current.cpuInstructions).toBe(15000);
    expect(fileContent.metrics.baseline.cpuInstructions).toBe(10000);
    expect(fileContent.metrics.deltas.cpuInstructions.delta).toBe(5000);
    expect(fileContent.metrics.deltas.cpuInstructions.percent).toBe("50.00%");
  });
});
