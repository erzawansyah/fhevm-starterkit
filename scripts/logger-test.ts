import { logger } from "./helper/logger";

logger.section("🧪 Logger Test");

// Basic logging methods
logger.info("This is an info message.");
logger.success("This is a success message.");
logger.warning("This is a warning message.");
logger.error("This is an error message.");
logger.debug("This is a debug message.");
logger.log("This is a plain log message.");

logger.newLine();

// Section and subsection
logger.subsection("Testing Subsections");
logger.info("This is inside a subsection.");

logger.newLine();

// Separator
logger.separator();

// Key-value display
logger.keyValue("Name", "FHEVM Starterkit");
logger.keyValue("Version", "1.0.0");
logger.keyValue("Status", "Testing");

logger.newLine();

// Table display
logger.section("📊 Table Test");
logger.table({
  Network: "Zama Testnet",
  ChainId: "8009",
  Status: "Active",
  Contracts: "5",
});

logger.newLine();

// Loading with clear
logger.loading("Processing data");
[
  "Fetching data...",
  "Processing data...",
  "Encoding results...",
  "Validating...",
  "Finalizing...",
].forEach((step, index) => {
  setTimeout(() => {
    logger.loading(step);
  }, index * 1000);
});
