import { spotKeywords, spotSymbols, SpotToken } from './SpotToken';
import { CodeFileReader } from './CodeFileReader';
import assert from 'node:assert';

export function tokeniseCode(code: string): SpotToken[] {
  const codeReader = new CodeFileReader(code);
  const tokens: SpotToken[] = [];
  while (!codeReader.isEOF) {
    // try to match comments
    if (codeReader.peak('//')) {
      const commentLocation = codeReader.cloneLocation();

      // rest of the line is a comment
      codeReader.consume('//');
      const commentText = codeReader.restOfCurrentLine;
      codeReader.consume(commentText);
      tokens.push({
        type: 'comment',
        location: commentLocation,
        comment: commentText,
      });
    }

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

    // try to match a float literal
    const floatMatch = codeReader.restOfCurrentLine.match(/^([0-9]+\.[0-9]+)/);
    if (floatMatch !== null) {
      const floatLocation = codeReader.cloneLocation();
      const floatString = floatMatch[0];
      const floatValue = parseFloat(floatString);
      assert(!isNaN(floatValue), 'Should have parsed a float');

      const didConsume = codeReader.consume(floatString);
      assert(didConsume, 'Should have consumed the float literal');

      tokens.push({
        type: 'float',
        location: floatLocation,
        float: floatValue,
      });
      continue;
    }

    // try to read an integer literal
    const intMatch = codeReader.restOfCurrentLine.match(/^([0-9]+)/);
    if (intMatch !== null) {
      const intLocation = codeReader.cloneLocation();
      const intString = intMatch[0];
      const intValue = parseInt(intString, 10);
      assert(!isNaN(intValue), 'Should have parsed an integer');

      const didConsume = codeReader.consume(intString);
      assert(didConsume, 'Should have consumed the integer literal');

      tokens.push({
        type: 'int',
        location: intLocation,
        int: intValue,
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
