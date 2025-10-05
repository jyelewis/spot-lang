import { spotKeywords, spotSymbols, SpotToken, TOKEN_TYPES } from './SpotToken';
import { StringReader } from './StringReader';
import assert from 'node:assert';

export function tokeniseCode(code: string): SpotToken[] {
  const tokeniser = new Tokeniser(code);
  return tokeniser.tokenise();
}

class Tokeniser {
  private codeReader: StringReader;
  private tokens: SpotToken[] = [];

  constructor(code: string) {
    this.codeReader = new StringReader(code);
  }

  tokenise(): SpotToken[] {
    while (!this.codeReader.isEOF) {
      if (this.tryMatchComment()) continue;
      if (this.tryMatchKeyword()) continue;
      if (this.tryMatchIdentifier()) continue;
      if (this.tryMatchSymbol()) continue;
      if (this.tryMatchStringTemplate()) continue;
      if (this.tryMatchNumber()) continue;

      this.throwUnrecognizedTokenError();
    }
    return this.tokens;
  }

  private tryMatchComment(): boolean {
    if (!this.codeReader.peak('//')) return false;

    const commentLocation = this.codeReader.cloneLocation();
    this.codeReader.consume('//');
    const commentText = this.codeReader.restOfCurrentLine;
    this.codeReader.consume(commentText);

    this.tokens.push({
      type: TOKEN_TYPES.COMMENT,
      location: commentLocation,
      comment: commentText,
    });
    return true;
  }

  private tryMatchKeyword(): boolean {
    for (const keyword of spotKeywords) {
      if (this.codeReader.peak(keyword)) {
        const location = this.codeReader.cloneLocation();
        this.codeReader.consume(keyword);
        this.tokens.push({
          type: TOKEN_TYPES.KEYWORD,
          location,
          keyword,
        });
        return true;
      }
    }
    return false;
  }

  private tryMatchIdentifier(): boolean {
    // Fixed regex: should not match identifiers starting with numbers
    const identifierMatch = this.codeReader.restOfCurrentLine.match(/^([A-Za-z_][A-Za-z0-9_]*)/);
    if (!identifierMatch) return false;

    const identifier = identifierMatch[0];

    // Ensure identifier isn't a keyword that was missed
    if ((spotKeywords as readonly string[]).includes(identifier)) {
      return false; // Let keyword matcher handle it
    }

    const location = this.codeReader.cloneLocation();
    this.codeReader.consume(identifier);
    this.tokens.push({
      type: TOKEN_TYPES.IDENTIFIER,
      location,
      identifier,
    });
    return true;
  }

  private tryMatchSymbol(): boolean {
    for (const symbol of spotSymbols) {
      if (this.codeReader.peak(symbol)) {
        const location = this.codeReader.cloneLocation();
        this.codeReader.consume(symbol);
        this.tokens.push({
          type: TOKEN_TYPES.SYMBOL,
          location,
          symbol,
        });
        return true;
      }
    }
    return false;
  }

  private tryMatchStringTemplate(): boolean {
    if (!this.codeReader.peak('"')) return false;

    const startLocation = this.codeReader.cloneLocation();

    // Emit string template start token
    this.tokens.push({
      type: TOKEN_TYPES.STRING_TEMPLATE_START,
      location: startLocation,
    });

    this.codeReader.moveAheadBy(1); // consume opening quote

    let literal = '';

    while (!this.codeReader.isEOF && !this.codeReader.peak('"')) {
      const char = this.codeReader.restOfCurrentLine.charAt(0);

      if (char === '\\') {
        // Handle escape sequences
        this.codeReader.moveAheadBy(1);
        if (this.codeReader.isEOF) {
          throw new Error(
            `Unterminated string template at line ${startLocation.line}, column ${startLocation.column}`
          );
        }
        const escapedChar = this.codeReader.restOfCurrentLine.charAt(0);
        literal += this.processEscapeSequence(escapedChar);
        this.codeReader.moveAheadBy(1);
      } else if (char === '{') {
        // Found start of expression - emit current literal if any
        if (literal.length > 0) {
          this.tokens.push({
            type: TOKEN_TYPES.STRING_LITERAL,
            location: this.codeReader.cloneLocation(),
            literal,
          });
          literal = '';
        }

        // Emit expression start token
        const exprStartLocation = this.codeReader.cloneLocation();
        this.tokens.push({
          type: TOKEN_TYPES.STRING_TEMPLATE_EXPRESSION_START,
          location: exprStartLocation,
        });

        this.codeReader.moveAheadBy(1); // consume '{'
        this.codeReader.consumeWhitespace(); // consume any whitespace after '{'

        // Parse the expression inside {}
        this.parseStringTemplateExpression();

        // Consume '}' and emit expression end token
        if (!this.codeReader.peak('}')) {
          throw new Error(
            `Expected '}' to close expression in string template at line ${exprStartLocation.line}, column ${exprStartLocation.column}`
          );
        }

        const exprEndLocation = this.codeReader.cloneLocation();
        this.tokens.push({
          type: TOKEN_TYPES.STRING_TEMPLATE_EXPRESSION_END,
          location: exprEndLocation,
        });

        this.codeReader.moveAheadBy(1); // consume '}'
      } else {
        literal += char;
        this.codeReader.moveAheadBy(1);
      }
    }

    if (this.codeReader.isEOF) {
      throw new Error(
        `Unterminated string template at line ${startLocation.line}, column ${startLocation.column}`
      );
    }

    // Emit final literal if any
    if (literal.length > 0) {
      this.tokens.push({
        type: TOKEN_TYPES.STRING_LITERAL,
        location: this.codeReader.cloneLocation(),
        literal,
      });
    }

    this.codeReader.moveAheadBy(1); // consume closing quote
    this.codeReader.consumeWhitespace(); // consume trailing whitespace

    // Emit string template end token
    this.tokens.push({
      type: TOKEN_TYPES.STRING_TEMPLATE_END,
      location: this.codeReader.cloneLocation(),
    });

    return true;
  }

  private parseStringTemplateExpression(): void {
    // Parse tokens inside the expression until we hit '}'
    let braceDepth = 0;

    while (!this.codeReader.isEOF) {
      // Check if we've hit the closing brace at depth 0
      if (this.codeReader.peak('}') && braceDepth === 0) {
        break;
      }

      // Track nested braces
      if (this.codeReader.peak('{')) {
        braceDepth++;
      } else if (this.codeReader.peak('}')) {
        braceDepth--;
      }

      // Parse individual tokens within the expression
      if (this.tryMatchComment()) continue;
      if (this.tryMatchKeyword()) continue;
      if (this.tryMatchIdentifier()) continue;
      if (this.tryMatchSymbol()) continue;
      if (this.tryMatchStringTemplate()) continue; // Allow nested string templates
      if (this.tryMatchNumber()) continue;

      // If we get here, we have an unrecognized character
      this.throwUnrecognizedTokenError();
    }
  }

  private processEscapeSequence(char: string): string {
    switch (char) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case '\\':
        return '\\';
      case '"':
        return '"';
      case '0':
        return '\0';
      default:
        // For unknown escape sequences, just return the character as-is
        return char;
    }
  }

  private tryMatchNumber(): boolean {
    const numberMatch = this.codeReader.restOfCurrentLine.match(/^(\d+(?:\.\d+)?)/);
    if (!numberMatch) return false;

    const location = this.codeReader.cloneLocation();
    const numberString = numberMatch[0];
    const isFloat = numberString.includes('.');

    this.codeReader.consume(numberString);

    if (isFloat) {
      const floatValue = parseFloat(numberString);
      assert(!isNaN(floatValue), 'Should have parsed a float');
      this.tokens.push({
        type: TOKEN_TYPES.FLOAT,
        location,
        float: floatValue,
      });
    } else {
      const intValue = parseInt(numberString, 10);
      assert(!isNaN(intValue), 'Should have parsed an integer');
      this.tokens.push({
        type: TOKEN_TYPES.INT,
        location,
        int: intValue,
      });
    }

    return true;
  }

  private throwUnrecognizedTokenError(): never {
    const location = this.codeReader.cloneLocation();
    const context = this.codeReader.restOfCurrentLine.slice(0, 20);
    const char = this.codeReader.restOfCurrentLine.charAt(0);

    throw new Error(
      `Unexpected character '${char}' at line ${location.line}, column ${location.column}\n` +
        `Context: "${context}${context.length === 20 ? '...' : ''}"`
    );
  }
}
