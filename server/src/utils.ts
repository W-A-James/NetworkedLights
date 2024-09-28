export function log (...args: any[]): void {
  const date = new Date();
  console.log(`[${date.toISOString()}]`, ...args);
}

export function error (...args: any[]): void {
  const date = new Date();
  console.error(`[${date.toISOString()}]`, ...args);
}
