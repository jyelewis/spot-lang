import { SpotToken, SpotTokenKeyword } from '../1_tokeniser/SpotToken';
import { ParserError } from './ParserError';
import {
  SpotExpression,
  SpotExpressionFunctionDefinition,
  SpotExpressionStringLiteral,
  SpotExpressionStringTemplate,
  SpotExpressionVariableDeclaration,
  SpotExpressionIntLiteral,
} from './Expressions';
import { SpotStatement } from './Statements';
import assert from 'node:assert';

// TODO: this must always parse expressions which I don't love, are all expressions statements? Probably not
// TODO: test me

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
    const next = this.next();

    switch (next.type) {
      case 'keyword':
        return this.parseKeyword(next);
      case 'symbol': {
        throw new Error(`Unimplemented symbol in block: ${next.symbol}`);
      }
      case 'identifier':
        return this.parseIdentifier();
      case 'string_literal':
        return this.parseStringLiteral();
      case 'string_template_start':
        return this.parseStringTemplate();
      default:
        throw new Error(`Unimplemented token type: ${next.type}`);
    }
  }

  parseKeyword(token: SpotTokenKeyword): SpotStatement {
    switch (token.keyword) {
      case 'func':
        return this.parseFunctionDefinition();
      case 'let':
        return this.parseVariableDeclaration();
      default:
        throw new Error(`Unimplemented keyword: ${token.keyword}`);
    }
  }

  parseStringLiteral(): SpotExpressionStringLiteral {
    const stringLiteral = this.consume('string_literal');
    assert(stringLiteral);

    return {
      type: 'string_literal',
      location: stringLiteral.location,
      string: stringLiteral.literal, // TODO: why don't these match?
    };
  }

  parseIntLiteral(): SpotExpressionIntLiteral {
    const intLiteral = this.consume('int');
    assert(intLiteral);

    return {
      type: 'int_literal',
      location: intLiteral.location,
      value: intLiteral.int,
    };
  }

  parseStringTemplate(): SpotExpressionStringTemplate {
    const startToken = this.consume('string_template_start');
    const parts: (SpotExpressionStringLiteral | SpotExpression)[] = [];

    // Parse all parts until we hit string_template_end
    while (this.next().type !== 'string_template_end') {
      const next = this.next();

      if (next.type === 'string_literal') {
        parts.push(this.parseStringLiteral());
      } else if (next.type === 'string_template_expression_start') {
        // Consume the expression start token
        this.consume('string_template_expression_start');

        // Parse the expression inside
        const expression = this.parseExpression();
        parts.push(expression);

        // Consume the expression end token
        this.consume('string_template_expression_end');
      } else {
        throw new Error(`Unexpected token in string template: ${next.type}`);
      }
    }

    // Consume the string_template_end token
    this.consume('string_template_end');

    return {
      type: 'string_template',
      location: startToken.location,
      parts,
    };
  }

  parseExpression(): SpotExpression {
    const next = this.next();

    switch (next.type) {
      case 'identifier':
        return this.parseIdentifierExpression();
      case 'string_literal':
        return this.parseStringLiteral();
      case 'string_template_start':
        return this.parseStringTemplate();
      case 'int':
        return this.parseIntLiteral();
      default:
        throw new Error(`Cannot parse expression for token type: ${next.type}`);
    }
  }

  parseIdentifierExpression(): SpotExpression {
    const token = this.consume('identifier');
    const identifierText = token.identifier;

    // Check if this is a function call
    const next = this.next();
    if (next.type === 'symbol' && next.symbol === '(') {
      // This is a function call, parse it as such
      this.consume('symbol'); // consume the '('

      const params: SpotExpression[] = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const nextToken = this.next();
        if (nextToken.type === 'symbol' && nextToken.symbol === ')') {
          // consume the closing paran
          this.consume('symbol');

          // end of function call
          return {
            type: 'function_call',
            location: token.location,
            functionVariable: {
              type: 'variable_identifier',
              location: token.location,
              identifierText,
            },
            parameters: params,
          };
        }

        params.push(this.parseExpression());

        // consume commas after each param (optionally)
        const next2 = this.next();
        if (next2.type === 'symbol' && next2.symbol === ',') {
          this.consume('symbol'); // consume the comma
          continue;
        }
        if (next2.type !== 'symbol' || next2.symbol !== ')') {
          throw new ParserError('Expected , or ) after function call parameter', next2.location);
        }
      }
    }

    // Otherwise it's just a variable identifier
    return {
      type: 'variable_identifier',
      location: token.location,
      identifierText,
    };
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
    // eslint-disable-next-line no-constant-condition
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

  parseVariableDeclaration(): SpotExpressionVariableDeclaration {
    const letKeyword = this.consume('keyword');
    if (letKeyword.keyword !== 'let') {
      throw new ParserError('Expected let keyword', letKeyword.location);
    }

    const nameToken = this.consume('identifier');
    const variableName = nameToken.identifier;

    const equalsSymbol = this.consume('symbol');
    if (equalsSymbol.symbol !== '=') {
      throw new ParserError('Expected = after variable name', equalsSymbol.location);
    }

    const value = this.parseExpression();

    return {
      type: 'variable_declaration',
      location: letKeyword.location,
      variableName,
      value,
    };
  }

  parseIdentifier(): SpotExpression {
    // This is used in statement context, so we need to check for variable assignments too
    const token = this.consume('identifier');
    const identifierText = token.identifier;

    const next = this.next();

    // Handle variable assignments (statements)
    if (next.type === 'symbol' && next.symbol === '=') {
      this.consume('symbol'); // consume '='
      throw new ParserError('Unimplemented variable assignment', next.location);
    }

    // Handle function calls and variable references (expressions)
    if (next.type === 'symbol' && next.symbol === '(') {
      // This is a function call, parse it as such
      this.consume('symbol'); // consume the '('

      const params: SpotExpression[] = [];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const nextToken = this.next();
        if (nextToken.type === 'symbol' && nextToken.symbol === ')') {
          // consume the closing paran
          this.consume('symbol');

          // end of function call
          return {
            type: 'function_call',
            location: token.location,
            functionVariable: {
              type: 'variable_identifier',
              location: token.location,
              identifierText,
            },
            parameters: params,
          };
        }

        params.push(this.parseExpression());

        // consume commas after each param (optionally)
        const next2 = this.next();
        if (next2.type === 'symbol' && next2.symbol === ',') {
          this.consume('symbol'); // consume the comma
          continue;
        }
        if (next2.type !== 'symbol' || next2.symbol !== ')') {
          throw new ParserError('Expected , or ) after function call parameter', next2.location);
        }
      }
    }

    // If no symbols follow, it's just a variable reference
    return {
      type: 'variable_identifier',
      location: token.location,
      identifierText,
    };
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
