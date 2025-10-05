import { StringReader } from './StringReader';

describe('StringReader', () => {
  it('Skips whitespace on init', () => {
    const reader = new StringReader('   \n   abc');
    expect(reader.location).toEqual({ line: 2, column: 4 });
    expect(reader.restOfCurrentLine).toBe('abc');
  });

  it('Skips whitespace after consume', () => {
    const reader = new StringReader('abc  \n def');
    expect(reader.restOfCurrentLine).toBe('abc  ');
    reader.consume('abc');
    expect(reader.restOfCurrentLine).toBe('def');
    reader.consume('def');
    expect(reader.isEOF);
  });
});
