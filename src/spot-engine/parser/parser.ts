import { SpotToken, SpotTokenIdentifier, SpotTokenKeyword } from '../tokeniser/SpotToken';
import { ParserError } from './ParserError';
import { SpotExpressionFunctionCall, SpotExpressionFunctionDefinition } from './Expressions';
import { SpotStatement } from './Statements';
import assert from 'node:assert';

export function parseCodeTokens(tokens: SpotToken[]): SpotStatement[] {
  const parser = new Parser(tokens);
  return parser.parse();
}

class Parser {
  private tokens: SpotToken[];
  private position: number;

  constructor(tokens: SpotToken[]) {
    this.tokens = tokens;
    this.position = 0;
  }

  parse(): SpotStatement[] {
    const topLevelBody: SpotStatement[] = [];
    while (this.position < this.tokens.length) {
      topLevelBody.push(this.parseNext());
    }
    return topLevelBody;
  }

  parseNext(): SpotStatement {
    const next = this.tokens[this.position];

    switch (next.type) {
      case 'keyword':
        return this.parseKeyword(next);
      case 'symbol': {
        throw new Error(`Unimplemented symbol in block: ${next.symbol}`);
      }
      case 'identifier':
        return this.parseIdentifier();
      default:
        throw new Error(`Unimplemented token type: ${next.type}`);
    }
  }

  parseKeyword(token: SpotTokenKeyword): SpotStatement {
    switch (token.keyword) {
      case 'func':
        return this.parseFunctionDefinition();
      default:
        throw new Error(`Unimplemented keyword: ${token.keyword}`);
    }
  }

  parseFunctionDefinition(): SpotExpressionFunctionDefinition {
    // TODO: this is pretty jank
    const funcKeyword = this.consume('keyword');
    if (funcKeyword.keyword !== 'func') {
      throw new ParserError(
        'Expected func keyword before function definition',
        funcKeyword.location
      );
    }

    const nameToken = this.consume('identifier');
    const functionName = nameToken.identifier;

    const openParan = this.consume('symbol'); // (
    if (openParan.symbol !== '(') {
      throw new ParserError('Expected ( after function name', openParan.location);
    }

    const closeParan = this.consume('symbol'); // )
    if (closeParan.symbol !== ')') {
      throw new ParserError(
        'Expected ) after function parameters (we dont support params yet)',
        closeParan.location
      );
    }

    const openBrace = this.consume('symbol'); // {
    if (openBrace.symbol !== '{') {
      throw new ParserError('Expected { to start function body', openBrace.location);
    }

    // consume until we find a closing brace
    const body: SpotStatement[] = [];
    while (true) {
      const next = this.next();
      if (next.type === 'symbol' && next.symbol === '}') {
        // end of our function!
        break;
      }

      body.push(this.parseNext());
    }

    // we're expecting this as we peaked it
    const closingSymbol = this.consume('symbol');
    if (closingSymbol.symbol !== '}') {
      throw new ParserError('Expected } to end function body', closingSymbol.location);
    }

    return {
      type: 'function_definition',
      location: funcKeyword.location,
      functionName,
      body,
    };
  }

  parseIdentifier(): SpotExpressionFunctionCall {
    // name++;
    // name = "Joe";
    // name()

    const token = this.consume('identifier');
    const identifierText = token.identifier;

    const following = this.consume('symbol');
    if (following.symbol === '=') {
      // variable assignment
      throw new ParserError('Unimplemented variable assignment', following.location);
    }
    if (following.symbol === '(') {
      // function call
      const next = this.next();
      if (next.type === 'symbol' && next.symbol === ')') {
        // end of function call
        return {
          type: 'function_call',
          location: token.location,
          functionVariable: {
            type: 'variable_identifier',
            location: token.location,
            identifierText,
          },
        };
      }

      // we don't support params yet
      throw new ParserError('Unimplemented function call with parameters', next.location);
    }

    throw new Error(`Unexpected symbol after identifier: ${following.symbol}`);
  }

  peak(tokenType: string): SpotToken | null {
    if (this.next().type === tokenType) {
      return this.next();
    }

    return null;
  }

  next(): SpotToken {
    assert(this.position < this.tokens.length, 'No more tokens to consume');
    return this.tokens[this.position];
  }

  consume<T extends SpotToken['type']>(tokenType: T): SpotToken & { type: T } {
    if (!this.peak(tokenType)) {
      throw new ParserError(
        'Expected token of type ' + tokenType,
        this.tokens[this.position].location
      );
    }

    return this.tokens[this.position++] as SpotToken & { type: T };
  }
}
