import { SpotStatement } from '../2_parser/Statements';
import { Operation, RegisterReference } from './Operations';
import { CompilerError } from './CompilerError';
import {
  SpotExpression,
  SpotExpressionFunctionCall,
  SpotExpressionFunctionDefinition,
} from '../2_parser/Expressions';

let nextRegisterIndex = 0;

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

  for (const statement of funcDef.body) {
    if (statement.type !== 'function_call') {
      throw new CompilerError(
        `Unimplemented statement type in function body ${statement.type}`,
        statement.location
      );
    }

    const funcCallOperations = compileFunctionCallToBytecode(statement);
    operations.push(...funcCallOperations);
  }

  return { operations };
}

function compileFunctionCallToBytecode(funcCall: SpotExpressionFunctionCall): Operation[] {
  const computeParamsOperations: Operation[] = [];
  const discardParamsOperations: Operation[] = [];
  const paramRegisterReferences: RegisterReference[] = [];

  for (const paramExpression of funcCall.parameters) {
    const paramExpressionEvaluation = compileExpression(paramExpression);
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

function compileExpression(expression: SpotExpression): {
  computeOperations: Operation[];
  resultRegister: RegisterReference;
  discardOperations: Operation[];
} {
  if (expression.type !== 'string_literal') {
    throw new CompilerError(
      `Unimplemented expression type ${expression.type}`,
      expression.location
    );
  }

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
