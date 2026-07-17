import fs from "fs";
import path from "path";

interface TestResult {
  file: string;
  title: string;
  status: "passed" | "failed" | "skipped";
  error?: string;
}

export function generateReport(results: TestResult[]) {
  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed").length;
  const total = results.length;
  const score = Math.round((passed / total) * 10 * 100) / 100;

  const report = `# SpringHub E2E Test Report
Date: ${new Date().toISOString()}

## Executive Summary
- **Health Score**: ${score}/10
- **Total Tests**: ${total}
- **Passed**: ${passed}
- **Failed**: ${failed}
- **Pass Rate**: ${Math.round((passed / total) * 100)}%

## Results
| # | File | Test | Status | Error |
|---|---|---|---|---|
${results.map((r, i) => `| ${i + 1} | ${r.file} | ${r.title} | ${r.status === "passed" ? "✅" : "❌"} ${r.status} | ${r.error || ""} |`).join("\n")}

## Performance Recommendations
- [ ] Check LCP (Largest Contentful Paint) target < 2.5s
- [ ] Check image optimization
- [ ] Check bundle size
`;

  const reportPath = path.join(process.cwd(), "e2e-report-summary.md");
  fs.writeFileSync(reportPath, report);
  console.log(`Report saved to ${reportPath}`);
}
