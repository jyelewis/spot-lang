import { SpotToken } from '../tokeniser/SpotToken';

function parseCodeTokens(tokens: SpotToken[]): unknown {
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

  parse(): unknown {}

  peak(tokenType: string): boolean {
    if (this.position >= this.tokens.length) {
      return false;
    }
    return this.tokens[this.position].type === tokenType;
  }

  consume(tokenType: string): SpotToken | null {
    if (this.peak(tokenType)) {
      return this.tokens[this.position++];
    }
    return null;
  }
}
