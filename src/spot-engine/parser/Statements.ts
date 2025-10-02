import { SpotExpression } from './Expressions';

// export interface SpotStatementExpression {
//   type: 'expression';
//   location: CodeLocation;
//
//   expression: SpotExpression;
// }

// expressions are valid statements too (maybe not forever though?)
export type SpotStatement = SpotExpression; //  | SpotStatementExpression;
