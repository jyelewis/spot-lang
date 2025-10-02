import fs from 'node:fs/promises';
import { tokeniseCode } from './tokeniser/tokeniser';
import { parseCodeTokens } from './parser/parser';

export async function executeCodeFile(codeFilePath: string): Promise<string> {
  const code = await fs.readFile(codeFilePath, 'utf-8');

  const tokens = tokeniseCode(code);
  const ast = parseCodeTokens(tokens);
  console.log(tokens);

  // fake output, we can't execute this for real yet
  return 'Hello, world!';
}
