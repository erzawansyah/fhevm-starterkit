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

type LogLevel = "silent" | "error" | "warning" | "info" | "success" | "debug";

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  silent: 99,
  error: 50,
  warning: 40,
  success: 35, // success is like info but often useful in prod
  info: 30,
  debug: 10,
};

type LoggerOptions = {
  level?: LogLevel;
  timestamps?: boolean;
  colors?: boolean;
  scope?: string;
  silent?: boolean;
  // You can redirect output e.g. to a file stream (process.stdout by default)
  out?: NodeJS.WritableStream;
  err?: NodeJS.WritableStream;
};

function envLevel(): LogLevel | undefined {
  const raw = (
    process.env.LOG_LEVEL ||
    process.env.LOGLEVEL ||
    ""
  ).toLowerCase();
  if (!raw) return undefined;

  if (raw === "warn") return "warning";
  if (raw === "err") return "error";
  if (raw === "log") return "info";
  if (raw === "none") return "silent";

  const allowed: LogLevel[] = [
    "silent",
    "error",
    "warning",
    "info",
    "success",
    "debug",
  ];
  return allowed.includes(raw as LogLevel) ? (raw as LogLevel) : undefined;
}

function supportsColor(): boolean {
  // very small heuristic; safe default
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  return Boolean(process.stdout.isTTY);
}

function formatTime(d = new Date()): string {
  // 2025-12-24 16:05:03
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function stripAnsi(input: string): string {
  // basic ansi stripper
  return input.replace(/\x1b\[[0-9;]*m/g, "");
}

class Logger {
  private level: LogLevel;
  private timestamps: boolean;
  private useColors: boolean;
  private scope?: string;
  private silent: boolean;
  private out: NodeJS.WritableStream;
  private err: NodeJS.WritableStream;

  // spinner state
  private spinnerTimer: NodeJS.Timeout | null = null;
  private spinnerMessage: string = "";
  private spinnerFrame: number = 0;

  constructor(options: LoggerOptions = {}) {
    const resolvedLevel = options.level ?? envLevel() ?? "info";

    this.level = resolvedLevel;
    this.timestamps = options.timestamps ?? false;
    this.useColors = options.colors ?? supportsColor();
    this.scope = options.scope;
    this.silent = options.silent ?? false;

    this.out = options.out ?? process.stdout;
    this.err = options.err ?? process.stderr;
  }

  /**
   * Create a derived logger with additional scope and/or overridden options.
   * (Tidak mengubah fungsionalitas lama, hanya tambahan.)
   */
  child(scope: string, options: LoggerOptions = {}): Logger {
    return new Logger({
      level: options.level ?? this.level,
      timestamps: options.timestamps ?? this.timestamps,
      colors: options.colors ?? this.useColors,
      scope: this.scope ? `${this.scope}:${scope}` : scope,
      silent: options.silent ?? this.silent,
      out: options.out ?? this.out,
      err: options.err ?? this.err,
    });
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setTimestamps(enabled: boolean): void {
    this.timestamps = enabled;
  }

  setScope(scope?: string): void {
    this.scope = scope;
  }

  setSilent(silent: boolean): void {
    this.silent = silent;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.silent) return false;
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.level];
  }

  private c(text: string): string {
    // color wrapper; if colors disabled, strip ANSI
    return this.useColors ? text : stripAnsi(text);
  }

  private prefix(): string {
    const parts: string[] = [];
    if (this.timestamps)
      parts.push(this.c(`${colors.dim}[${formatTime()}]${colors.reset}`));
    if (this.scope)
      parts.push(this.c(`${colors.dim}[${this.scope}]${colors.reset}`));
    return parts.length ? parts.join(" ") + " " : "";
  }

  private writeOut(line: string, ...args: any[]): void {
    // If spinner is running, avoid corrupting the line: clear first, write, then redraw
    const hadSpinner = this.spinnerTimer !== null;
    if (hadSpinner) this.clearLine();

    // emulate console.log formatting with args
    const full = args.length ? `${line} ${args.map(String).join(" ")}` : line;
    this.out.write(full + "\n");

    if (hadSpinner) this.redrawSpinner();
  }

  private writeErr(line: string, ...args: any[]): void {
    const hadSpinner = this.spinnerTimer !== null;
    if (hadSpinner) this.clearLine();

    const full = args.length ? `${line} ${args.map(String).join(" ")}` : line;
    this.err.write(full + "\n");

    if (hadSpinner) this.redrawSpinner();
  }

  private stopSpinner(): void {
    if (this.spinnerTimer) {
      clearInterval(this.spinnerTimer);
      this.spinnerTimer = null;
      this.spinnerMessage = "";
      this.spinnerFrame = 0;
      this.clearLine();
    }
  }

  private redrawSpinner(): void {
    if (!this.spinnerTimer) return;
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const frame = frames[this.spinnerFrame % frames.length];
    const msg = `${this.c(
      `${colors.cyan}${frame} ${this.spinnerMessage}...${colors.reset}`
    )}`;
    this.out.write(msg + "\r");
  }

  /**
   * Log info message (cyan color)
   */
  info(message: string, ...args: any[]): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.cyan}ℹ INFO:${colors.reset}`
      )} ${message}`,
      ...args
    );
  }

  /**
   * Log success message (green color)
   */
  success(message: string, ...args: any[]): void {
    if (!this.shouldLog("success")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.green}✓ SUCCESS:${colors.reset}`
      )} ${message}`,
      ...args
    );
  }

  /**
   * Log warning message (yellow color)
   */
  warning(message: string, ...args: any[]): void {
    if (!this.shouldLog("warning")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.yellow}⚠ WARNING:${colors.reset}`
      )} ${message}`,
      ...args
    );
  }

  /**
   * Log error message (red color)
   */
  error(message: string, ...args: any[]): void {
    if (!this.shouldLog("error")) return;
    this.stopSpinner();
    this.writeErr(
      `${this.prefix()}${this.c(
        `${colors.red}✖ ERROR:${colors.reset}`
      )} ${message}`,
      ...args
    );
  }

  /**
   * Log debug message (magenta color)
   */
  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog("debug")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.magenta}🐛 DEBUG:${colors.reset}`
      )} ${message}`,
      ...args
    );
  }

  /**
   * Log plain message without formatting
   */
  log(message: string, ...args: any[]): void {
    if (!this.shouldLog("info")) return; // treat as info visibility
    this.stopSpinner();
    this.writeOut(`${this.prefix()}${message}`, ...args);
  }

  /**
   * Create a section header
   */
  section(title: string): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    const line = "=".repeat(50);
    this.writeOut(
      `\n${this.c(`${colors.bright}${colors.blue}${line}${colors.reset}`)}`
    );
    this.writeOut(
      `${this.c(`${colors.bright}${colors.blue}${title}${colors.reset}`)}`
    );
    this.writeOut(
      `${this.c(`${colors.bright}${colors.blue}${line}${colors.reset}`)}\n`
    );
  }

  /**
   * Create a subsection header
   */
  subsection(title: string): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.c(`\n${colors.dim}${"-".repeat(title.length)}${colors.reset}`)}`
    );
    this.writeOut(`${this.c(`${colors.bright}${title}${colors.reset}`)}`);
    this.writeOut(
      `${this.c(`${colors.dim}${"-".repeat(title.length)}${colors.reset}`)}`
    );
  }

  /**
   * Display a loading spinner (simple dots animation)
   * NOTE: kompatibel dengan API lama. Sekarang benar-benar spinner.
   */
  loading(message: string): void {
    if (!this.shouldLog("info")) return;
    this.spinnerMessage = message;

    if (this.spinnerTimer) {
      // already running: just update message + redraw
      this.redrawSpinner();
      return;
    }

    this.spinnerFrame = 0;
    this.spinnerTimer = setInterval(() => {
      this.spinnerFrame++;
      this.redrawSpinner();
    }, 80);
  }

  /**
   * Clear the current line (useful after loading)
   */
  clearLine(): void {
    // keep spinner state, just clear the line
    this.out.write("\r\x1b[K");
  }

  /**
   * Display key-value pairs
   */
  keyValue(key: string, value: any): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.bright}${key}:${colors.reset}`
      )} ${value}`
    );
  }

  /**
   * Display a table-like structure
   */
  table(
    data: Record<string, any>,
    orientation: "horizontal" | "vertical" = "horizontal"
  ): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();

    if (orientation === "vertical") {
      const rows = Object.entries(data).map(([key, value]) => ({
        field: key,
        value:
          typeof value === "object"
            ? JSON.stringify(value)
            : String(value),
      }));

      console.table(rows);
      return;
    }

    console.table(data);
  }



  /**
   * Add blank line
   */
  newLine(): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    this.writeOut("");
  }

  /**
   * Display a separator line
   */
  separator(): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.dim}${"─".repeat(50)}${colors.reset}`
      )}`
    );
  }

  command(message: string): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();
    this.writeOut(
      `${this.prefix()}${this.c(
        `${colors.bright}${colors.green}> ${message}${colors.reset}`
      )}`
    );
  }

  /**
   * Flexible banner / header printer.
   * Example: prints a boxed tag + title and rows like Local / Network.
   */
  banner(options: {
    emoji?: string;
    tag?: string; // e.g. 'astro' or 'VITE'
    tagColor?: keyof typeof colors; // color for the tag label
    message?: string; // main title / subtitle
    rows?: Array<{ label: string; value: any; valueColor?: keyof typeof colors }>;
    note?: string; // optional yellow note line
  }): void {
    if (!this.shouldLog("info")) return;
    this.stopSpinner();

    const e = options.emoji ? `${options.emoji} ` : "";

    const tagColored = options.tag
      ? this.c(
        `${options.tagColor ? (colors as any)[options.tagColor] : ""}${colors.bright} ${options.tag} ${colors.reset}`
      )
      : "";

    const msg = options.message ? this.c(`${colors.green}${options.message}${colors.reset}`) : "";

    // Header line: emoji + tag + message
    const headerParts = [e, tagColored, msg].filter(Boolean).join(" ");
    if (headerParts) this.writeOut(this.prefix() + headerParts);

    // Rows (like Local / Network)
    if (options.rows && options.rows.length) {
      for (const r of options.rows) {
        const label = this.c(`${colors.dim}${r.label}${colors.reset}`);
        const value = r.valueColor
          ? this.c(`${(colors as any)[r.valueColor]}${r.value}${colors.reset}`)
          : String(r.value);
        this.writeOut(`${this.prefix()}${label}: ${value}`);
      }
    }

    if (options.note) {
      this.writeOut(this.prefix() + this.c(`${colors.yellow}${options.note}${colors.reset}`));
    }
  }

}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export default Logger;
