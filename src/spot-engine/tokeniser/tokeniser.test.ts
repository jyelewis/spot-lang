import { tokeniseCode } from './tokeniser';

describe('Tokeniser', () => {
  it('Reads hello world example', async () => {
    const code = `
    
func main() {
  print("Hello, World!")
}
`;
    const tokens = tokeniseCode(code);
    expect(tokens).toMatchSnapshot();
  });
});
