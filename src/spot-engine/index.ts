#!/usr/bin/env node
import fs from 'node:fs/promises';
import { tokeniseCode } from './1_tokeniser/tokeniser';
import { parseCodeTokens } from './2_parser/parser';
import { compileASTToApplication } from './3_compiler/compiler';
import { executeApplication } from './4_vm/vm';
import { program } from 'commander';

program.name('spot').description('The spot programming langauge').version('0.0.1');

program
  .command('run')
  .description('Executes a .spot file')
  .argument('<string>', '[script.spot]')
  .action(async (inputFilePath) => {
    const code = await fs.readFile(inputFilePath, 'utf-8');

    const tokens = tokeniseCode(code);
    const ast = parseCodeTokens(tokens);
    const byteCodeApplication = compileASTToApplication(ast);
    await executeApplication(byteCodeApplication);
  });

program
  .command('show-tokens')
  .description('Show the tokens produced by the tokenizer')
  .argument('<string>', '[script.spot]')
  .action(async (inputFilePath) => {
    const code = await fs.readFile(inputFilePath, 'utf-8');
    const tokens = tokeniseCode(code);
    console.log(JSON.stringify(tokens, null, 2));
  });

program
  .command('show-ast')
  .description('Show the Abstract Syntax Tree produced by the parser')
  .argument('<string>', '[script.spot]')
  .action(async (inputFilePath) => {
    const code = await fs.readFile(inputFilePath, 'utf-8');
    const tokens = tokeniseCode(code);
    const ast = parseCodeTokens(tokens);
    console.log(JSON.stringify(ast, null, 2));
  });

program
  .command('show-bytecode')
  .description('Show the bytecode produced by the compiler')
  .argument('<string>', '[script.spot]')
  .action(async (inputFilePath) => {
    const code = await fs.readFile(inputFilePath, 'utf-8');
    const tokens = tokeniseCode(code);
    const ast = parseCodeTokens(tokens);
    const byteCodeApplication = compileASTToApplication(ast);
    console.log(JSON.stringify(byteCodeApplication, null, 2));
  });

program.parse();
