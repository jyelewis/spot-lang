import path from 'node:path';
import fs from 'node:fs/promises';
import { tokeniseCode } from './1_tokeniser/tokeniser';
import { parseCodeTokens } from './2_parser/parser';
import { compileASTToApplication } from './3_compiler/compiler';
import { executeApplicationAndCaptureOutput } from './4_vm/vm';

const examplesDir = `${__dirname}/../../docs/code_examples`;

export async function executeCodeFile(codeFilePath: string, inputData?: string[]): Promise<string> {
  const code = await fs.readFile(codeFilePath, 'utf-8');

  const tokens = tokeniseCode(code);
  const ast = parseCodeTokens(tokens);
  const byteCodeApplication = compileASTToApplication(ast);
  const output = await executeApplicationAndCaptureOutput(byteCodeApplication, inputData);

  return output;
}

describe('Test against examples', () => {
  const runsExample = async (exampleName: string) => {
    const codeFilePath = path.join(examplesDir, `${exampleName}.spot`);
    const expectedOutputFilePath = path.join(examplesDir, `${exampleName}_output.txt`);
    const inputFilePath = path.join(examplesDir, `${exampleName}_input.txt`);

    // Check if input file exists and read it
    let inputData: string[] | undefined;
    try {
      const inputContent = await fs.readFile(inputFilePath, 'utf-8');
      inputData = inputContent.trim().split('\n');
    } catch (error) {
      // Input file doesn't exist, no input needed
    }

    const output = await executeCodeFile(codeFilePath, inputData);
    const expectedOutput = await fs.readFile(expectedOutputFilePath, 'utf-8');

    expect(output).toEqual(expectedOutput);
  };

  it(`Runs example '0_print_hello.spot`, () => runsExample('0_print_hello'));

  it(`Runs example '1_variables.spot`, () => runsExample('1_variables'));

  it(`Runs example '2_addition.spot`, () => runsExample('2_addition'));

  it(`Runs example '3_ifs.spot`, () => runsExample('3_ifs'));

  it(`Runs example '4_input.spot`, () => runsExample('4_input'));

  it(`Runs example '5_while.spot`, () => runsExample('5_while'));
});
