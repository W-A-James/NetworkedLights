function logPrefix (): string {
  const date = new Date();
  return `[${date.toISOString()}]`;
}

export function log (...args: any[]): void {
  console.log(logPrefix(), ...args);
}

export function error (...args: any[]): void {
  console.error(logPrefix(), ...args);
}

export function debug (...args: any[]): void {
  if (process.env.DEBUG != null) log(...args);
}
