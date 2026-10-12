"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const gasParser_1 = require("./parser/gasParser");
const commentReporter_1 = require("./github/commentReporter");
const exporter_1 = require("./exporter");
async function executePipelineRunner() {
    try {
        const githubToken = core.getInput('github-token') || process.env.GITHUB_TOKEN || "";
        const jsonReportPath = core.getInput('json-report-path') || 'soroban-gas-report.json';
        // Simulating Soroban execution tracing pipelines payload
        const simulatedStdoutLogs = `
      Simulating invocation transaction footprint execution metrics:
      CPU Instructions: 14820
      Memory Bytes: 5120
      Ledger Reads: 2
      Ledger Writes: 1
    `;
        const baselineMockMetrics = {
            cpuInstructions: 13200,
            memoryBytes: 4096,
            ledgerReads: 1,
            ledgerWrites: 1
        };
        core.info("Initializing extraction parser sequence engines...");
        const currentMetrics = gasParser_1.GasParser.parseSimulationOutput(simulatedStdoutLogs);
        const analysisReport = gasParser_1.GasParser.calculateDeltas(currentMetrics, baselineMockMetrics);
        core.info("Exporting structured telemetry JSON report...");
        exporter_1.GasExporter.exportReport(currentMetrics, baselineMockMetrics, analysisReport, jsonReportPath);
        core.info("Compiling output matrix into Markdown template presentation structures...");
        const markdownPayload = commentReporter_1.CommentReporter.generateMarkdownTable(analysisReport);
        if (githubToken) {
            await commentReporter_1.CommentReporter.postPullRequestComment(markdownPayload, githubToken);
        }
        else {
            core.warning("Execution framework isolated missing authentication keys context. Displaying output locally:");
            console.log(markdownPayload);
        }
    }
    catch (err) {
        core.setFailed(`Runner initialization caught unexpected execution exception: ${err.message}`);
    }
}
executePipelineRunner();
