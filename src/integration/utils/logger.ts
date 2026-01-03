export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private context: string

  constructor(context: string) {
    this.context = context
  }

  debug(message: string, ...args: any[]) {
    console.log(`[${this.context}] [DEBUG] ${message}`, ...args)
  }

  info(message: string, ...args: any[]) {
    console.log(`[${this.context}] [INFO] ${message}`, ...args)
  }

  warn(message: string, ...args: any[]) {
    console.warn(`[${this.context}] [WARN] ${message}`, ...args)
  }

  error(message: string, ...args: any[]) {
    console.error(`[${this.context}] [ERROR] ${message}`, ...args)
  }
}
