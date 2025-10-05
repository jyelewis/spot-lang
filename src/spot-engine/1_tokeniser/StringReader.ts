import { CodeLocation } from '../types';
import assert from 'node:assert';

export class StringReader {
  location: CodeLocation = { line: 1, column: 1 };
  lines: string[];

  constructor(public readonly code: string) {
    this.lines = code.split('\n');
    this.consumeWhitespace();
  }

  cloneLocation(): CodeLocation {
    return { ...this.location };
  }

  get currentLine(): string {
    return this.lines[this.location.line - 1];
  }

  get restOfCurrentLine(): string {
    return this.currentLine.slice(this.location.column - 1);
  }

  get isEOL(): boolean {
    return this.location.column > this.currentLine.length;
  }

  get isEOF(): boolean {
    return this.location.line === this.lines.length && this.isEOL;
  }

  peak(searchString: string): boolean {
    return this.restOfCurrentLine.startsWith(searchString);
  }

  moveAheadBy(numChars: number): void {
    assert(numChars >= 0);
    assert(numChars <= this.currentLine.length, 'Cannot move beyond end of line');

    this.location.column += numChars;

    // we may have moved to the end of the line, so bump to next line if so
    if (this.isEOL && !this.isEOF) {
      this.location.line += 1;
      this.location.column = 1;
      assert(this.location.line <= this.lines.length);
    }
  }

  consume(searchString: string): boolean {
    if (this.peak(searchString)) {
      this.moveAheadBy(searchString.length);

      this.consumeWhitespace();
      return true;
    }
    return false;
  }

  consumeWhitespace(): void {
    if (this.isEOL && !this.isEOF) {
      // edge case: end of a line
      // use the moveAheadBy auto trimmer
      this.moveAheadBy(0);
    }

    let nextChar = this.restOfCurrentLine.charAt(0);

    while (this.isWhitespace(nextChar)) {
      this.moveAheadBy(1);

      nextChar = this.restOfCurrentLine.charAt(0);
    }
  }

  isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\n' || char === '\r';
  }
}
