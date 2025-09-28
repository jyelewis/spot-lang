import path from 'node:path';
import { executeCodeFile } from './index';
import fs from 'node:fs/promises';

const examplesDir = `${__dirname}/../../docs/code_examples`;

describe('Test against examples', () => {
  const runsExample = async (exampleName: string) => {
    const codeFilePath = path.join(examplesDir, `${exampleName}.spot`);
    const expectedOutputFilePath = path.join(examplesDir, `${exampleName}_output.txt`);

    const output = await executeCodeFile(codeFilePath);
    const expectedOutput = await fs.readFile(expectedOutputFilePath, 'utf-8');

    expect(output).toEqual(expectedOutput);
  };

  it(`Runs example '0_print_hello.spot`, () => runsExample('0_print_hello'));
});
