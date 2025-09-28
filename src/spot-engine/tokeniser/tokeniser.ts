import { spotKeywords, spotSymbols, SpotToken } from './SpotToken';
import { CodeFileReader } from './CodeFileReader';
import assert from 'node:assert';

export function tokeniseCode(code: string): SpotToken[] {
  const codeReader = new CodeFileReader(code);
  const tokens: SpotToken[] = [];
  while (!codeReader.isEOF) {
    // try to match keyword tokens
    let foundKeyword = false;
    for (const keyword of spotKeywords) {
      if (codeReader.consume(keyword)) {
        foundKeyword = true;
        tokens.push({
          type: 'keyword',
          location: codeReader.cloneLocation(),
          keyword,
        });
        break;
      }
    }

    if (foundKeyword) {
      continue;
    }

    // try to match identifier tokens
    const identifierMatch = codeReader.restOfCurrentLine.match(/^([A-Za-z_][A-Z-a-z0-9_]+)/);
    if (identifierMatch) {
      const identifier = identifierMatch[0];
      codeReader.consume(identifier);
      tokens.push({
        type: 'identifier',
        location: codeReader.cloneLocation(),
        identifier,
      });
      continue;
    }

    let foundSymbol = false;
    for (const symbol of spotSymbols) {
      if (codeReader.consume(symbol)) {
        tokens.push({
          type: 'symbol',
          location: codeReader.cloneLocation(),
          symbol,
        });
        foundSymbol = true;
        break;
      }
    }

    if (foundSymbol) {
      continue;
    }

    // try to read a string literal
    if (codeReader.peak('"')) {
      const startLocation = codeReader.cloneLocation();

      // TODO: revisit with more robust string handling
      const endColumn = codeReader.restOfCurrentLine.substring(1).indexOf('"');

      const literal = codeReader.restOfCurrentLine.substring(1, endColumn + 1);
      const didConsume = codeReader.consume(`"${literal}"`);
      assert(didConsume, 'Should have consumed the string literal');

      tokens.push({
        type: 'string_literal',
        location: startLocation,
        literal,
      });
      continue;
    }

    throw new Error(
      'Unrecognised token at ' +
        JSON.stringify(codeReader.cloneLocation()) +
        ': "' +
        codeReader.restOfCurrentLine.slice(0, 10) +
        '"' +
        (codeReader.restOfCurrentLine.length > 10 ? '...' : '')
    );
  }

  return tokens;
}
