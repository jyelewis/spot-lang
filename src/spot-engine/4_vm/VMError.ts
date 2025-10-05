export class VMError extends Error {
  constructor(message: string) {
    super(`${message} at ???`);
    this.name = 'VMError';
  }
}
