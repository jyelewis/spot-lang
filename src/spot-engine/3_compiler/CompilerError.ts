import { CodeLocation } from '../1_tokeniser/types';

export class CompilerError extends Error {
  constructor(message: string, location: CodeLocation) {
    super(`${message} at line ${location.line}:${location.column}`);
    this.name = 'CompilerError';
  }
}
