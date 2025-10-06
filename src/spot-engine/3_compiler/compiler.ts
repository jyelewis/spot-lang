import { SpotStatement } from '../2_parser/Statements';
import { Operation, RegisterReference } from './Operations';
import { CompilerError } from './CompilerError';
import {
  SpotExpression,
  SpotExpressionFunctionCall,
  SpotExpressionFunctionDefinition,
  SpotExpressionVariableDeclaration,
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
  const operations: Operation[] = [];
  const context: CompilationContext = {
    variableRegisters: new Map(),
  };

  for (const statement of funcDef.body) {
    if (statement.type === 'function_call') {
      const funcCallOperations = compileFunctionCallToBytecode(statement, context);
      operations.push(...funcCallOperations);
    } else if (statement.type === 'variable_declaration') {
      const varDeclOperations = compileVariableDeclarationToBytecode(statement, context);
      operations.push(...varDeclOperations);
    } else {
      throw new CompilerError(
        `Unimplemented statement type in function body ${statement.type}`,
        statement.location
      );
    }
  }

  return { operations };
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

  throw new CompilerError(`Unimplemented expression type ${expression.type}`, expression.location);
}
