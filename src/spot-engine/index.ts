import fs from 'node:fs/promises';
import { tokeniseCode } from './1_tokeniser/tokeniser';
import { parseCodeTokens } from './2_parser/parser';
import { compileASTToApplication } from './3_compiler/compiler';
import { executeApplication } from './4_vm/vm';

async function main() {
  const inputFile = process.argv[2];
  if (!inputFile) {
    console.error('Usage: spot <input-file.spot>');
    process.exit(1);
  }

  const code = await fs.readFile(inputFile, 'utf-8');

  const tokens = tokeniseCode(code);
  const ast = parseCodeTokens(tokens);
  const byteCodeApplication = compileASTToApplication(ast);
  await executeApplication(byteCodeApplication);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Error during execution:');
    console.error(err);
    process.exit(1);
  });
}
