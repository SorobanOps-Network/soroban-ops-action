import * as core from '@actions/core';
import * as github from '@actions/github';

export class CommentReporter {
public static generateMarkdownTable(analysis: Record<string, { current: number; baseline: number; delta: number; percent: string }>): string {
    let markdown = `### Soroban Smart Contract Gas & Resource Impact Report\n\n`;
    markdown += `| Resource Metric | Baseline Value | Current PR Value | Absolute Delta | Percentage Shift |\n`;
    markdown += `| :--- | :---: | :---: | :---: | :---: |\n`;

    // TODO: [Drips Wave - Formatting Improvements] Add a status column showing a green check emoji for reductions and a red warning flag for regressions.

    for (const [metric, data] of Object.entries(analysis)) {
      const standardMetricName = metric.replace(/([A-Z])/g, " $1").trim().toUpperCase();
      markdown += `| **${standardMetricName}** | ${data.baseline} | ${data.current} | ${data.delta >= 0 ? `+${data.delta}` : data.delta} | ${data.percent} |\n`;
    }

    markdown += `\n\n*Report executed autonomously on commit milestone change tracking verification frameworks.*`;
    return markdown;
  }

  public static async postPullRequestComment(commentBody: string, token: string): Promise<void> {
    const context = github.context;
    if (!context.payload.pull_request) {
      core.info("Execution scope context lacks pull request object framework. Skipping deployment comment payload routing.");
      return;
    }

    const prNumber = context.payload.pull_request.number;
    const octokit = github.getOctokit(token);

    // TODO: [Drips Wave - Analytics Extension] Route generated metrics telemetry arrays payload into external visualization dashboards databases.

    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: prNumber,
      body: commentBody
    });

    core.info(`Resource utilization comment successfully pushed to Pull Request link index reference #${prNumber}`);
  }
}