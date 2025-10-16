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

### Intrinsic Functions

Built-in functions are implemented as intrinsics in the standard library:

1. **Compiler Definition** (`3_compiler/compiler.ts`):
   ```typescript
   application.modules['std'] = {
     functions: {
       print: { intrinsic: 'print' },
       input: { intrinsic: 'input' },
     },
   };
   ```

2. **VM Implementation** (`4_vm/vm.ts`):
   - Intrinsic functions are executed directly by the VM
   - Support both sync and async operations
   - Can return values that are stored in target registers

### Function Return Values

Functions can return values using the register system:

- **Function calls with return values**: Include optional `targetRegister` in `FunctionCallOperation`
- **Intrinsic returns**: Async intrinsic functions can return values directly
- **Register assignment**: VM stores return values in the specified target register

### Test Infrastructure

The example test system supports interactive programs:

- **Input files**: Tests can read input from `<example>_input.txt` files
- **Output validation**: Expected output is verified against `<example>_output.txt`
- **VM input injection**: Test framework provides mock input functions during execution
- **Backward compatibility**: Examples without input files continue to work normally

### VM Execution Model

- **Async support**: VM operations and intrinsics support async/await patterns
- **Register lifecycle**: Registers are allocated, used, and cleared as operations execute
- **Function call flow**: `executeFunction()` handles both bytecode and intrinsic execution paths
- **Input/Output abstraction**: `printFn` and `inputFn` can be overridden for testing or different environments

When working with the language implementation:

- Follow the 4-stage pipeline when adding new features
- Each stage should have corresponding tests
- The `SpotApplication` format bridges compiler output and VM input
- Use intrinsics for built-in functionality that needs direct system access
- Ensure async operations are properly handled throughout the execution chain
