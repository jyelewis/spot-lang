import { tokeniseCode } from './tokeniser';
import path from 'node:path';
import fs from 'node:fs/promises';

const examplesDir = `${__dirname}/../../../docs/code_examples`;

describe('Tokeniser', () => {
  describe('code_examples folder', () => {
    const tokeniseExample = async (exampleName: string) => {
      const codeFilePath = path.join(examplesDir, `${exampleName}.spot`);
      const code = await fs.readFile(codeFilePath, 'utf-8');

      return await tokeniseCode(code);
    };

    it(`Tokenises '0_print_hello.spot`, () =>
      expect(tokeniseExample('0_print_hello')).resolves.toMatchSnapshot());

    it(`Tokenises '1_variables.spot`, () =>
      expect(tokeniseExample('1_variables')).resolves.toMatchSnapshot());

    it(`Tokenises '2_addition.spot`, () =>
      expect(tokeniseExample('2_addition')).resolves.toMatchSnapshot());

    it(`Tokenises '3_ifs.spot`, () => expect(tokeniseExample('3_ifs')).resolves.toMatchSnapshot());
  });

  describe('Specific case', () => {
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

    it('Int addition', () => {
      const code = `
func main() {
  let num = (123 + 456) - 1
}
`;
      const tokens = tokeniseCode(code);
      expect(tokens).toMatchSnapshot();
    });

    it('String addition', () => {
      const code = `
func main() {
  let name = "John" + " Doe"
}
`;
      const tokens = tokeniseCode(code);
      expect(tokens).toMatchSnapshot();
    });

    it('Variable addition', () => {
      const code = `
func main() {
  let first_name = "John"
  let last_name = "Doe"
  
  let name = first_name + " " + last_name
}
`;
      const tokens = tokeniseCode(code);
      expect(tokens).toMatchSnapshot();
    });

    // TODO: parsed string template support
  });
});
