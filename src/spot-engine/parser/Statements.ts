import { CodeLocation } from '../tokeniser/types';
import { SpotExpression } from './Expressions';

export interface SpotStatementExpression {
  type: 'expression';
  location: CodeLocation;

  expression: SpotExpression;
}

export type SpotStatement = SpotStatementExpression;
