import * as core from '@actions/core';
import { GasParser, GasMetrics } from './parser/gasParser';
import { CommentReporter } from './github/commentReporter';

async function executePipelineRunner() {
  try {
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || "";

    // Simulating Soroban execution tracing pipelines payload
    const simulatedStdoutLogs = `
      Simulating invocation transaction footprint execution metrics:
      CPU Instructions: 14820
      Memory Bytes: 5120
      Ledger Reads: 2
      Ledger Writes: 1
    `;

    const baselineMockMetrics: GasMetrics = {
      cpuInstructions: 13200,
      memoryBytes: 4096,
      ledgerReads: 1,
      ledgerWrites: 1
    };

    core.info("Initializing extraction parser sequence engines...");
    const currentMetrics = GasParser.parseSimulationOutput(simulatedStdoutLogs);
    const analysisReport = GasParser.calculateDeltas(currentMetrics, baselineMockMetrics);

    core.info("Compiling output matrix into Markdown template presentation structures...");
    const markdownPayload = CommentReporter.generateMarkdownTable(analysisReport);

    if (githubToken) {
      await CommentReporter.postPullRequestComment(markdownPayload, githubToken);
    } else {
      core.warning("Execution framework isolated missing authentication keys context. Displaying output locally:");
      console.log(markdownPayload);
    }
  } catch (err: any) {
    core.setFailed(`Runner initialization caught unexpected execution exception: ${err.message}`);
  }
}

executePipelineRunner();