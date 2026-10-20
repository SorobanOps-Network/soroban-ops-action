import * as core from '@actions/core';
import { GasParser, GasMetrics } from './parser/gasParser';
import { CommentReporter } from './github/commentReporter';
import { GasExporter } from './exporter';
import { BudgetAnalyzer } from './analyzer';

async function executePipelineRunner() {
  try {
    const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || "";
    const jsonReportPath = core.getInput('json-report-path') || 'soroban-gas-report.json';
    const maxCpuInput = core.getInput('max_cpu_increase_percent') || core.getInput('max-cpu-increase-percent');
    const maxMemInput = core.getInput('max_mem_increase_percent') || core.getInput('max-mem-increase-percent');

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

    core.info("Exporting structured telemetry JSON report...");
    GasExporter.exportReport(currentMetrics, baselineMockMetrics, analysisReport, jsonReportPath);

    core.info("Compiling output matrix into Markdown template presentation structures...");
    const reportTitle = core.getInput('report_title') || "Soroban Smart Contract Gas & Resource Impact Report";
    const markdownPayload = CommentReporter.generateMarkdownTable(analysisReport, reportTitle);

    if (githubToken) {
      await CommentReporter.postPullRequestComment(markdownPayload, githubToken);
    } else {
      core.warning("Execution framework isolated missing authentication keys context. Displaying output locally:");
      console.log(markdownPayload);
    }

    core.info("Evaluating resource budget failure thresholds...");
    const thresholds = {
      maxCpuIncreasePercent: BudgetAnalyzer.parseThreshold(maxCpuInput),
      maxMemIncreasePercent: BudgetAnalyzer.parseThreshold(maxMemInput)
    };
    BudgetAnalyzer.enforce(analysisReport, thresholds);
  } catch (err: any) {
    core.setFailed(`Runner initialization caught unexpected execution exception: ${err.message}`);
  }
}

executePipelineRunner();