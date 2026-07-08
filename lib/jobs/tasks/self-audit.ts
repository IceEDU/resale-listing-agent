import { runSelfAudit } from "../../audit/self-audit";
import { listItems, saveAuditResults } from "../../store";
import type { JobTask } from "../types";

export const selfAuditTask: JobTask = {
  name: "self-audit",
  description: "Verify the app's own data and recommendations for consistency",
  async execute({ dryRun }) {
    const items = await listItems();
    const findings = runSelfAudit(items);
    if (!dryRun) await saveAuditResults(findings);
    const errors = findings.filter((f) => f.severity === "error").length;
    const warnings = findings.filter((f) => f.severity === "warning").length;
    const infos = findings.filter((f) => f.severity === "info").length;
    return {
      summary: `${errors} error${errors === 1 ? "" : "s"}, ${warnings} warning${warnings === 1 ? "" : "s"}, ${infos} info over ${items.length} items${dryRun ? " (dry run, not saved)" : ""}`,
    };
  },
};
