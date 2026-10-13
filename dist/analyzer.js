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
exports.BudgetAnalyzer = void 0;
const core = __importStar(require("@actions/core"));
class BudgetAnalyzer {
    /**
     * Parses raw threshold string (supports formats like "15", "15%", "15.5%") into a number.
     * Returns undefined if input is missing, empty, or unparseable.
     */
    static parseThreshold(value) {
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
    static evaluate(analysis, thresholds) {
        const violations = [];
        const getPercentShift = (metricData) => {
            if (metricData.baseline > 0) {
                return ((metricData.current - metricData.baseline) / metricData.baseline) * 100;
            }
            return parseFloat(metricData.percent) || 0;
        };
        const formatPercent = (val) => {
            const rounded = Math.round(val * 100) / 100;
            const formatted = Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(2)}%`;
            return rounded > 0 ? `+${formatted}` : formatted;
        };
        // 1. Evaluate CPU Instructions threshold
        if (thresholds.maxCpuIncreasePercent !== undefined &&
            thresholds.maxCpuIncreasePercent !== null &&
            !isNaN(thresholds.maxCpuIncreasePercent)) {
            const cpuData = analysis['cpuInstructions'] || analysis['cpu_instructions'];
            if (cpuData) {
                const cpuShift = getPercentShift(cpuData);
                if (cpuShift > thresholds.maxCpuIncreasePercent) {
                    violations.push(`CPU limit exceeded: ${formatPercent(cpuShift)} > Max ${thresholds.maxCpuIncreasePercent}%`);
                }
            }
        }
        // 2. Evaluate Memory Bytes threshold
        if (thresholds.maxMemIncreasePercent !== undefined &&
            thresholds.maxMemIncreasePercent !== null &&
            !isNaN(thresholds.maxMemIncreasePercent)) {
            const memData = analysis['memoryBytes'] || analysis['memory_bytes'];
            if (memData) {
                const memShift = getPercentShift(memData);
                if (memShift > thresholds.maxMemIncreasePercent) {
                    violations.push(`Memory limit exceeded: ${formatPercent(memShift)} > Max ${thresholds.maxMemIncreasePercent}%`);
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
    static enforce(analysis, thresholds) {
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
exports.BudgetAnalyzer = BudgetAnalyzer;
