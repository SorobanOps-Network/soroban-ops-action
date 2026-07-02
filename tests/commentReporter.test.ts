import { CommentReporter } from '../src/github/commentReporter';

describe('CommentReporter Presentation Tests Suite', () => {
  test('Should format raw calculations correctly into structured clean markdown grids tables', () => {
    const simulatedAnalysis = {
      cpuInstructions: { current: 150, baseline: 100, delta: 50, percent: "50.00%" }
    };

    const outputString = CommentReporter.generateMarkdownTable(simulatedAnalysis);
    expect(outputString).toContain("| **CPU INSTRUCTIONS** | 100 | 150 | +50 | 50.00% |");
    expect(outputString).toContain("### Soroban Smart Contract Gas & Resource Impact Report");
  });
});