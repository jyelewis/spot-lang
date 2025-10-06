import { CodeLocation } from '../types';
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
  parameters: SpotExpression[]; // TODO: implement parameters
}

export interface SpotExpressionStringLiteral {
  type: 'string_literal';
  location: CodeLocation;

  string: string;
}

export interface SpotExpressionStringTemplate {
  type: 'string_template';
  location: CodeLocation;

  parts: (SpotExpressionStringLiteral | SpotExpression)[];
}

export interface SpotExpressionVariableDeclaration {
  type: 'variable_declaration';
  location: CodeLocation;

  variableName: string;
  value: SpotExpression;
}

export interface SpotExpressionIntLiteral {
  type: 'int_literal';
  location: CodeLocation;

  value: number;
}

export type SpotExpression =
  | SpotExpressionFunctionDefinition
  | SpotExpressionVariableIdentifier
  | SpotExpressionFunctionCall
  | SpotExpressionStringLiteral
  | SpotExpressionStringTemplate
  | SpotExpressionVariableDeclaration
  | SpotExpressionIntLiteral;
