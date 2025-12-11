// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",

  // Text colors
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

class Logger {
  /**
   * Log info message (cyan color)
   */
  info(message: string, ...args: any[]): void {
    console.log(`${colors.cyan}ℹ INFO:${colors.reset} ${message}`, ...args);
  }

  /**
   * Log success message (green color)
   */
  success(message: string, ...args: any[]): void {
    console.log(`${colors.green}✓ SUCCESS:${colors.reset} ${message}`, ...args);
  }

  /**
   * Log warning message (yellow color)
   */
  warning(message: string, ...args: any[]): void {
    console.log(
      `${colors.yellow}⚠ WARNING:${colors.reset} ${message}`,
      ...args
    );
  }

  /**
   * Log error message (red color)
   */
  error(message: string, ...args: any[]): void {
    console.error(`${colors.red}✖ ERROR:${colors.reset} ${message}`, ...args);
  }

  /**
   * Log debug message (magenta color)
   */
  debug(message: string, ...args: any[]): void {
    console.log(
      `${colors.magenta}🐛 DEBUG:${colors.reset} ${message}`,
      ...args
    );
  }

  /**
   * Log plain message without formatting
   */
  log(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  /**
   * Create a section header
   */
  section(title: string): void {
    const line = "=".repeat(50);
    console.log(`\n${colors.bright}${colors.blue}${line}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${title}${colors.reset}`);
    console.log(`${colors.bright}${colors.blue}${line}${colors.reset}\n`);
  }

  /**
   * Create a subsection header
   */
  subsection(title: string): void {
    console.log(`\n${colors.bright}${title}${colors.reset}`);
    console.log(`${colors.dim}${"-".repeat(title.length)}${colors.reset}\n`);
  }

  /**
   * Display a loading spinner (simple dots animation)
   */
  loading(message: string): void {
    process.stdout.write(`${colors.cyan}⏳ ${message}...${colors.reset}\r`);
  }

  /**
   * Clear the current line (useful after loading)
   */
  clearLine(): void {
    process.stdout.write("\r\x1b[K");
  }

  /**
   * Display key-value pairs
   */
  keyValue(key: string, value: any): void {
    console.log(`${colors.bright}${key}:${colors.reset} ${value}`);
  }

  /**
   * Display a table-like structure
   */
  table(data: Record<string, any>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.keyValue(key, value);
    });
  }

  /**
   * Add blank line
   */
  newLine(): void {
    console.log("");
  }

  /**
   * Display a separator line
   */
  separator(): void {
    console.log(`${colors.dim}${"─".repeat(50)}${colors.reset}`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export default Logger;
