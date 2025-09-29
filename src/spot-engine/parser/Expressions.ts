import { CodeLocation } from '../tokeniser/types';
import { SpotStatement } from './Statements';

interface SpotExpressionFunctionDefinitionParameter {
  type: 'function_definition_parameter';
  location: CodeLocation;

  parameterName: SpotExpressionIdentifier;
  parameterType: SpotExpressionType;
  defaultValue: null | SpotExpression; // null means no default, not default of null
}

// TODO: what makes these valid at the top level?
interface SpotExpressionFunctionDefinition {
  type: 'function_definition';
  location: CodeLocation;

  functionName: string;
  parameters: SpotExpressionFunctionDefinitionParameter[];
  body: SpotStatement[];
}

interface SpotExpressionType {
  type: 'type';
  location: CodeLocation;

  typeName: string;
  // TODO: how does optional work?
  // optionalSuger?: boolean;
  // TODO: generics
}

type SpotExpressionIdentifier = string;

export type SpotExpression = SpotExpressionFunctionDefinition;
