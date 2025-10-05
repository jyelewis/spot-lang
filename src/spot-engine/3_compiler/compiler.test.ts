import { tokeniseCode } from '../1_tokeniser/tokeniser';
import { parseCodeTokens } from '../2_parser/parser';
import { compileASTToApplication } from './compiler';

describe('compiler', () => {
  it('compiles hello world', () => {
    const code = `
func main() {
  print("Hello, World!")
}
`;
    const tokens = tokeniseCode(code);
    const ast = parseCodeTokens(tokens);
    const byteCodeApplication = compileASTToApplication(ast);
    console.log(JSON.stringify(byteCodeApplication));
  });
});
