/**
 * Simple script to run the auth audit
 */

const { execSync } = require("child_process");
const path = require("path");

try {
  console.log("Compiling TypeScript...");
  execSync(
    "npx tsc src/scripts/authAudit.ts --esModuleInterop --resolveJsonModule",
    {
      stdio: "inherit",
    },
  );

  console.log("Running audit...");
  execSync("node src/scripts/authAudit.js", {
    stdio: "inherit",
  });

  console.log("Audit completed successfully!");
} catch (error) {
  console.error("Error running audit:", error);
  process.exit(1);
}
