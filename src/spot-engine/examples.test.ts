import path from 'node:path';
import fs from 'node:fs/promises';
import { tokeniseCode } from './1_tokeniser/tokeniser';
import { parseCodeTokens } from './2_parser/parser';
import { compileASTToApplication } from './3_compiler/compiler';
import { executeApplicationAndCaptureOutput } from './4_vm/vm';

const examplesDir = `${__dirname}/../../docs/code_examples`;

export async function executeCodeFile(codeFilePath: string): Promise<string> {
  const code = await fs.readFile(codeFilePath, 'utf-8');

  const tokens = tokeniseCode(code);
  const ast = parseCodeTokens(tokens);
  const byteCodeApplication = compileASTToApplication(ast);
  const output = await executeApplicationAndCaptureOutput(byteCodeApplication);

  return output;
}

describe('Test against examples', () => {
  const runsExample = async (exampleName: string) => {
    const codeFilePath = path.join(examplesDir, `${exampleName}.spot`);
    const expectedOutputFilePath = path.join(examplesDir, `${exampleName}_output.txt`);

    const output = await executeCodeFile(codeFilePath);
    const expectedOutput = await fs.readFile(expectedOutputFilePath, 'utf-8');

    expect(output).toEqual(expectedOutput);
  };

  it(`Runs example '0_print_hello.spot`, () => runsExample('0_print_hello'));

  it(`Runs example '1_variables.spot`, () => runsExample('1_variables'));
});
