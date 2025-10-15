import { SpotStatement } from '../2_parser/Statements';
import { Operation, RegisterReference } from './Operations';
import { CompilerError } from './CompilerError';
import {
  SpotExpression,
  SpotExpressionFunctionCall,
  SpotExpressionFunctionDefinition,
  SpotExpressionVariableDeclaration,
  SpotExpressionIfStatement,
} from '../2_parser/Expressions';

let nextRegisterIndex = 0;

interface CompilationContext {
  variableRegisters: Map<string, RegisterReference>;
}

export interface SpotApplication {
  modules: Record<
    string,
    {
      // can modules have top level variables?
      functions: Record<
        string,
        | {
            // parameters: unknown[]; // TODO: parameter types
            operations: Operation[];
          }
        | {
            intrinsic: string;
          }
      >;
    }
  >;
}

export function compileASTToApplication(ast: SpotStatement[]): SpotApplication {
  const application: SpotApplication = {
    modules: {},
  };

  // define stdlib
  application.modules['std'] = {
    functions: {
      print: {
        intrinsic: 'print',
      },
    },
  };

  // parse ast into application
  application.modules['main'] = {
    functions: {},
  };
  for (const topLevelStatement of ast) {
    if (topLevelStatement.type !== 'function_definition') {
      throw new CompilerError(
        'Only function definitions are supported at top level',
        topLevelStatement.location
      );
    }

    application.modules['main'].functions[topLevelStatement.functionName] = {
      operations: compileFunctionToBytecode(topLevelStatement).operations,
    };
  }

  return application;
}

function compileFunctionToBytecode(funcDef: SpotExpressionFunctionDefinition): {
  operations: Operation[];
} {
  const context: CompilationContext = {
    variableRegisters: new Map(),
  };

  // Step 1: Compile all statements with placeholder jumps
  const operationsWithPlaceholders: Operation[] = [];

  for (const statement of funcDef.body) {
    const baseIndex = operationsWithPlaceholders.length;

    if (statement.type === 'function_call') {
      const funcCallOperations = compileFunctionCallToBytecode(statement, context);
      operationsWithPlaceholders.push(...funcCallOperations);
    } else if (statement.type === 'variable_declaration') {
      const varDeclOperations = compileVariableDeclarationToBytecode(statement, context);
      operationsWithPlaceholders.push(...varDeclOperations);
    } else if (statement.type === 'if_statement') {
      const ifOperations = compileIfStatementToBytecodeWithOffset(statement, context, baseIndex);
      operationsWithPlaceholders.push(...ifOperations);
    } else {
      throw new CompilerError(
        `Unimplemented statement type in function body ${statement.type}`,
        statement.location
      );
    }
  }

  return { operations: operationsWithPlaceholders };
}

function compileFunctionCallToBytecode(
  funcCall: SpotExpressionFunctionCall,
  context: CompilationContext
): Operation[] {
  const computeParamsOperations: Operation[] = [];
  const discardParamsOperations: Operation[] = [];
  const paramRegisterReferences: RegisterReference[] = [];

  for (const paramExpression of funcCall.parameters) {
    const paramExpressionEvaluation = compileExpression(paramExpression, context);
    computeParamsOperations.push(...paramExpressionEvaluation.computeOperations);
    paramRegisterReferences.push(paramExpressionEvaluation.resultRegister);
    discardParamsOperations.push(...paramExpressionEvaluation.discardOperations);
  }

  return [
    ...computeParamsOperations,
    {
      type: 'function_call',
      location: funcCall.location,
      functionName: funcCall.functionVariable.identifierText,
      parameterValues: paramRegisterReferences,
    },
    ...discardParamsOperations,
  ];
}

function compileVariableDeclarationToBytecode(
  varDecl: SpotExpressionVariableDeclaration,
  context: CompilationContext
): Operation[] {
  const valueEvaluation = compileExpression(varDecl.value, context);

  // Store the register that contains the variable's value in our context
  // The register won't be discarded since the variable is still in scope
  context.variableRegisters.set(varDecl.variableName, valueEvaluation.resultRegister);

  return [
    ...valueEvaluation.computeOperations,
    // No discard operations since the variable register should stay alive
  ];
}

function compileIfStatementToBytecodeWithOffset(
  ifStmt: SpotExpressionIfStatement,
  context: CompilationContext,
  baseOffset: number
): Operation[] {
  // This is a simplified approach that calculates indices directly

  // Evaluate the condition
  const conditionEvaluation = compileExpression(ifStmt.condition, context);

  // Compile the then body
  const thenBodyOperations: Operation[] = [];
  for (const statement of ifStmt.thenBody) {
    if (statement.type === 'function_call') {
      const funcCallOperations = compileFunctionCallToBytecode(statement, context);
      thenBodyOperations.push(...funcCallOperations);
    } else if (statement.type === 'variable_declaration') {
      const varDeclOperations = compileVariableDeclarationToBytecode(statement, context);
      thenBodyOperations.push(...varDeclOperations);
    } else if (statement.type === 'if_statement') {
      // For nested if statements, we don't know the final offset yet, so we'll use relative positions
      const nestedIfOperations = compileIfStatementToBytecodeWithOffset(statement, context, 0);
      thenBodyOperations.push(...nestedIfOperations);
    } else {
      throw new CompilerError(
        `Unimplemented statement type in if body ${statement.type}`,
        statement.location
      );
    }
  }

  // Compile the else body (if present)
  const elseBodyOperations: Operation[] = [];
  if (ifStmt.elseBody) {
    for (const statement of ifStmt.elseBody) {
      if (statement.type === 'function_call') {
        const funcCallOperations = compileFunctionCallToBytecode(statement, context);
        elseBodyOperations.push(...funcCallOperations);
      } else if (statement.type === 'variable_declaration') {
        const varDeclOperations = compileVariableDeclarationToBytecode(statement, context);
        elseBodyOperations.push(...varDeclOperations);
      } else if (statement.type === 'if_statement') {
        // For nested if statements, we don't know the final offset yet, so we'll use relative positions
        const nestedIfOperations = compileIfStatementToBytecodeWithOffset(statement, context, 0);
        elseBodyOperations.push(...nestedIfOperations);
      } else {
        throw new CompilerError(
          `Unimplemented statement type in else body ${statement.type}`,
          statement.location
        );
      }
    }
  }

  // Build the operation list and calculate proper indices
  const operations: Operation[] = [];

  // Add condition evaluation
  operations.push(...conditionEvaluation.computeOperations);

  const conditionJumpIndex = operations.length;
  const thenStartIndex = conditionJumpIndex + 1;
  const elseStartIndex =
    thenStartIndex + thenBodyOperations.length + (elseBodyOperations.length > 0 ? 1 : 0);
  const cleanupStartIndex = elseStartIndex + elseBodyOperations.length;

  // Add conditional jump: if condition is false, jump to else (or cleanup if no else)
  const jumpTarget = elseBodyOperations.length > 0 ? elseStartIndex : cleanupStartIndex;
  operations.push({
    type: 'conditional_jump',
    location: ifStmt.location,
    conditionRegister: conditionEvaluation.resultRegister,
    jumpToOperation: baseOffset + jumpTarget,
  });

  // Add then body
  operations.push(...thenBodyOperations);

  // If there's an else body, add unconditional jump to skip it
  if (elseBodyOperations.length > 0) {
    operations.push({
      type: 'unconditional_jump',
      location: ifStmt.location,
      jumpToOperation: baseOffset + cleanupStartIndex,
    });

    // Add else body operations
    operations.push(...elseBodyOperations);
  }

  // Add cleanup operations (condition register disposal)
  operations.push(...conditionEvaluation.discardOperations);

  return operations;
}

function compileExpression(
  expression: SpotExpression,
  context: CompilationContext
): {
  computeOperations: Operation[];
  resultRegister: RegisterReference;
  discardOperations: Operation[];
} {
  if (expression.type === 'string_literal') {
    // compile string literal expression
    const resultRegister: RegisterReference = { index: nextRegisterIndex++ };

    return {
      computeOperations: [
        {
          type: 'load_constant',
          location: expression.location,
          targetRegister: resultRegister,
          value: expression.string,
        },
      ],
      resultRegister,
      discardOperations: [
        {
          type: 'clear_register',
          location: expression.location,
          register: resultRegister,
        },
      ],
    };
  }

  if (expression.type === 'string_template') {
    // Compile string templates with proper variable interpolation
    const resultRegister: RegisterReference = { index: nextRegisterIndex++ };
    const computeOperations: Operation[] = [];
    const discardOperations: Operation[] = [];
    const partRegisters: RegisterReference[] = [];

    // Evaluate each part and store in registers
    for (const part of expression.parts) {
      if (part.type === 'string_literal') {
        const partRegister: RegisterReference = { index: nextRegisterIndex++ };
        computeOperations.push({
          type: 'load_constant',
          location: part.location,
          targetRegister: partRegister,
          value: part.string,
        });
        partRegisters.push(partRegister);
        discardOperations.push({
          type: 'clear_register',
          location: part.location,
          register: partRegister,
        });
      } else {
        // Compile the expression part
        const partEvaluation = compileExpression(part, context);
        computeOperations.push(...partEvaluation.computeOperations);
        partRegisters.push(partEvaluation.resultRegister);
        discardOperations.push(...partEvaluation.discardOperations);
      }
    }

    // Add string concatenation operation
    computeOperations.push({
      type: 'string_concatenate',
      location: expression.location,
      targetRegister: resultRegister,
      partRegisters,
    });

    discardOperations.push({
      type: 'clear_register',
      location: expression.location,
      register: resultRegister,
    });

    return {
      computeOperations,
      resultRegister,
      discardOperations,
    };
  }

  if (expression.type === 'int_literal') {
    // compile integer literal expression
    const resultRegister: RegisterReference = { index: nextRegisterIndex++ };

    return {
      computeOperations: [
        {
          type: 'load_constant',
          location: expression.location,
          targetRegister: resultRegister,
          value: expression.value,
        },
      ],
      resultRegister,
      discardOperations: [
        {
          type: 'clear_register',
          location: expression.location,
          register: resultRegister,
        },
      ],
    };
  }

  if (expression.type === 'variable_identifier') {
    // Look up the variable in our context
    const variableRegister = context.variableRegisters.get(expression.identifierText);
    if (!variableRegister) {
      throw new CompilerError(
        `Variable '${expression.identifierText}' is not defined`,
        expression.location
      );
    }

    // Return the register that already contains the variable's value
    return {
      computeOperations: [], // No operations needed - just use the existing register
      resultRegister: variableRegister,
      discardOperations: [], // Don't discard since the variable is still in scope
    };
  }

  if (expression.type === 'binary_operation') {
    // Compile binary operation
    const leftEvaluation = compileExpression(expression.left, context);
    const rightEvaluation = compileExpression(expression.right, context);
    const resultRegister: RegisterReference = { index: nextRegisterIndex++ };

    return {
      computeOperations: [
        ...leftEvaluation.computeOperations,
        ...rightEvaluation.computeOperations,
        {
          type: 'arithmetic',
          location: expression.location,
          targetRegister: resultRegister,
          leftRegister: leftEvaluation.resultRegister,
          operator: expression.operator,
          rightRegister: rightEvaluation.resultRegister,
        },
      ],
      resultRegister,
      discardOperations: [
        ...leftEvaluation.discardOperations,
        ...rightEvaluation.discardOperations,
        {
          type: 'clear_register',
          location: expression.location,
          register: resultRegister,
        },
      ],
    };
  }

  if (expression.type === 'boolean_literal') {
    // compile boolean literal expression
    const resultRegister: RegisterReference = { index: nextRegisterIndex++ };

    return {
      computeOperations: [
        {
          type: 'load_constant',
          location: expression.location,
          targetRegister: resultRegister,
          value: expression.value,
        },
      ],
      resultRegister,
      discardOperations: [
        {
          type: 'clear_register',
          location: expression.location,
          register: resultRegister,
        },
      ],
    };
  }

  if (expression.type === 'unary_operation') {
    // Compile unary operation
    const operandEvaluation = compileExpression(expression.operand, context);
    const resultRegister: RegisterReference = { index: nextRegisterIndex++ };

    return {
      computeOperations: [
        ...operandEvaluation.computeOperations,
        {
          type: 'unary',
          location: expression.location,
          targetRegister: resultRegister,
          operator: expression.operator,
          operandRegister: operandEvaluation.resultRegister,
        },
      ],
      resultRegister,
      discardOperations: [
        ...operandEvaluation.discardOperations,
        {
          type: 'clear_register',
          location: expression.location,
          register: resultRegister,
        },
      ],
    };
  }

  throw new CompilerError(`Unimplemented expression type ${expression.type}`, expression.location);
}
