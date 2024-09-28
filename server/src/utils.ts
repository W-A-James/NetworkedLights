export function log (...args: any[]): void {
  const date = new Date();
  console.log(`[${date.toString()}]`, ...args);
}

export function error (...args: any[]): void {
  const date = new Date();
  console.error(`[${date.toString()}]`, ...args);
}
