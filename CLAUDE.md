# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Execute a Spot program file
yarn execute <file.spot>
yarn dev <file.spot>

# Build the project
yarn build

# Testing
yarn test                 # Run all tests
yarn test:watch          # Run tests in watch mode

# Code quality
yarn lint                # Lint TypeScript files
yarn lint:fix            # Fix linting issues automatically
yarn format              # Format code with Prettier
yarn format:check        # Check code formatting
yarn typecheck           # Run TypeScript type checking

# Pre-commit checks
yarn precommit           # Run all quality checks (format, lint, typecheck, test)
```

## Architecture

Spot is a hobby programming language implemented as a 4-stage compilation pipeline:

### Core Pipeline (src/spot-engine/)

1. **Tokeniser** (`1_tokeniser/`) - Converts source code into tokens
   - `CodeFileReader.ts` - Handles reading and position tracking in source files
   - `SpotToken.ts` - Defines token types, keywords, and symbols
   - `tokeniser.ts` - Main tokenisation logic

2. **Parser** (`2_parser/`) - Converts tokens into Abstract Syntax Tree (AST)
   - `Expressions.ts` - Function calls, definitions, literals
   - `Statements.ts` - Top-level statement types
   - `parser.ts` - Recursive descent parser implementation

3. **Compiler** (`3_compiler/`) - Compiles AST to bytecode operations
   - `Operations.ts` - Defines VM operations and register references
   - `compiler.ts` - Generates `SpotApplication` with modules and functions

4. **Virtual Machine** (`4_vm/`) - Executes compiled bytecode
   - `vm.ts` - `SpotVM` class that executes operations on registers
   - Supports both direct execution and output capture

### Entry Point

- `src/spot-engine/index.ts` - Main entry point with `executeCodeFile()` function
- Orchestrates the full pipeline: tokenise → parse → compile → execute

### Test Structure

- Each module has corresponding `.test.ts` files
- `examples.test.ts` - End-to-end language feature tests
- Jest configuration supports TypeScript with ts-jest preset

## Language Implementation Notes

The VM uses a register-based architecture where:

- Functions are compiled to sequences of `Operation` objects
- Operations manipulate `RegisterReference` objects
- The main module must contain a `main` function as the entry point
- Built-in functions can be implemented as intrinsics

When working with the language implementation:

- Follow the 4-stage pipeline when adding new features
- Each stage should have corresponding tests
- The `SpotApplication` format bridges compiler output and VM input
