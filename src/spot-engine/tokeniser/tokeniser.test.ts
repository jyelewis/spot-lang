import { tokeniseCode } from './tokeniser';

describe('Tokeniser', () => {
  it('Reads hello world example', () => {
    const code = `
    
func main() {
  print("Hello, World!")
}
`;
    const tokens = tokeniseCode(code);
    expect(tokens).toMatchSnapshot();
  });

  it('Variable definitions', () => {
    const code = `
    
func main() {
  let name = "John Doe"
  print("Hello, World!")
}
`;
    const tokens = tokeniseCode(code);
    expect(tokens).toMatchSnapshot();
  });

  it('Comments', () => {
    const code = `
    
func main() {
  // this is a comment
}
`;
    const tokens = tokeniseCode(code);
    expect(
      tokens.find((x) => x.type === 'comment' && x.comment === 'this is a comment')
    ).toBeDefined();
    expect(tokens).toMatchSnapshot();
  });

  it('Integers', () => {
    const code = `
func main() {
  let num = 123
}
`;
    const tokens = tokeniseCode(code);
    expect(tokens.find((x) => x.type === 'int' && x.int === 123)).toBeDefined();
    expect(tokens).toMatchSnapshot();
  });

  it('Floats', () => {
    const code = `
func main() {
  let num = 123.456
}
`;
    const tokens = tokeniseCode(code);
    expect(tokens.find((x) => x.type === 'float' && x.float === 123.456)).toBeDefined();
    expect(tokens).toMatchSnapshot();
  });
});
