import { GasParser, GasMetrics } from '../src/parser/gasParser';

describe('GasParser Utility Tests Suite', () => {
  const sampleLog = `
    Soroban Invocation Output Execution Parameters:
    CPU Instructions: 20000
    Memory Bytes: 8192
    Ledger Reads: 4
    Ledger Writes: 2
  `;

  test('Should accurately parse configuration lines from output strings', () => {
    const results = GasParser.parseSimulationOutput(sampleLog);
    expect(results.cpuInstructions).toBe(20000);
    expect(results.memoryBytes).toBe(8192);
    expect(results.ledgerReads).toBe(4);
    expect(results.ledgerWrites).toBe(2);
  });

  test('Should compute deltas correctly without rounding mutations errors', () => {
    const current: GasMetrics = { cpuInstructions: 15000, memoryBytes: 2000, ledgerReads: 2, ledgerWrites: 2 };
    const baseline: GasMetrics = { cpuInstructions: 10000, memoryBytes: 2000, ledgerReads: 1, ledgerWrites: 2 };

    const deltas = GasParser.calculateDeltas(current, baseline);
    expect(deltas.cpuInstructions.delta).toBe(5000);
    expect(deltas.cpuInstructions.percent).toBe("50.00%");
    expect(deltas.ledgerReads.delta).toBe(1);
    expect(deltas.ledgerReads.percent).toBe("100.00%");
    expect(deltas.ledgerWrites.delta).toBe(0);
    expect(deltas.ledgerWrites.percent).toBe("0.00%");
  });
});