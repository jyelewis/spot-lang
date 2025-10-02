import { CodeLocation } from '../tokeniser/types';
import { SpotStatement } from './Statements';

// interface SpotExpressionFunctionDefinitionParameter {
//   type: 'function_definition_parameter';
//   location: CodeLocation;
//
//   parameterName: SpotExpressionIdentifier;
//   parameterType: SpotExpressionType;
//   defaultValue: null | SpotExpression; // null means no default, not default of null
// }

// TODO: is a function an expression, statement, or something else?
export interface SpotExpressionFunctionDefinition {
  type: 'function_definition';
  location: CodeLocation;

  functionName: string;
  // parameters: SpotExpressionFunctionDefinitionParameter[];
  body: SpotStatement[];
}

export interface SpotExpressionVariableIdentifier {
  type: 'variable_identifier';
  location: CodeLocation;

  identifierText: string;
}

export interface SpotExpressionFunctionCall {
  type: 'function_call';
  location: CodeLocation;

  functionVariable: SpotExpressionVariableIdentifier;
}

export type SpotExpression =
  | SpotExpressionFunctionDefinition
  | SpotExpressionVariableIdentifier
  | SpotExpressionFunctionCall;
