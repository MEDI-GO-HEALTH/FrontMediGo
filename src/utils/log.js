// Utility for logging messages
export const log = {
  info: (message, ...args) => console.info(`[INFO]: ${message}`, ...args),
  warn: (message, ...args) => console.warn(`[WARN]: ${message}`, ...args),
  error: (message, ...args) => console.error(`[ERROR]: ${message}`, ...args),
};