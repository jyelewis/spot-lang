import { CodeLocation } from '../types';

// comment: '// this is a comment'
// keyword: func, let, if, else, return
// symbol: "(" "{" ","
// identifier: hello_world
// StringTemplateStart
// StringLiteral: "Hello world!"
// StringTemplateExpressionStart
// StringTemplateExpressionEnd
// StringTemplateEnd
// int: 123
// float: 45.67

type SpotTokenBase<T extends string> = {
  type: T;
  location: CodeLocation;
};

export interface SpotTokenComment extends SpotTokenBase<'comment'> {
  comment: string;
}

export const spotKeywords = ['func', 'let', 'mut', 'if', 'else', 'return'] as const;
type SpotKeyword = (typeof spotKeywords)[number];

export interface SpotTokenKeyword extends SpotTokenBase<'keyword'> {
  keyword: SpotKeyword;
}

export const spotSymbols = [
  '(',
  ')',
  '{',
  '}',
  ',',
  ';',
  '=',
  '+',
  '-',
  '*',
  '/',
  '<',
  '>',
  '!',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '.',
  '[',
  ']',
] as const;
type SpotSymbol = (typeof spotSymbols)[number];
export interface SpotTokenSymbol extends SpotTokenBase<'symbol'> {
  symbol: SpotSymbol;
}

export interface SpotTokenIdentifier extends SpotTokenBase<'identifier'> {
  identifier: string;
}

export interface SpotTokenStringTemplateStart extends SpotTokenBase<'string_template_start'> {
  type: 'string_template_start';
  location: CodeLocation;
}

export interface SpotTokenStringLiteral extends SpotTokenBase<'string_literal'> {
  literal: string;
}

export interface SpotTokenStringTemplateExpressionStart
  extends SpotTokenBase<'string_template_expression_start'> {}

export interface SpotTokenStringTemplateExpressionEnd
  extends SpotTokenBase<'string_template_expression_end'> {}

export interface SpotTokenStringTemplateEnd extends SpotTokenBase<'string_template_end'> {}

export interface SpotTokenInt extends SpotTokenBase<'int'> {
  int: number;
}

export interface SpotTokenFloat extends SpotTokenBase<'float'> {
  float: number;
}

export type SpotToken =
  | SpotTokenComment
  | SpotTokenKeyword
  | SpotTokenSymbol
  | SpotTokenIdentifier
  | SpotTokenStringTemplateStart
  | SpotTokenStringLiteral
  | SpotTokenStringTemplateExpressionStart
  | SpotTokenStringTemplateExpressionEnd
  | SpotTokenStringTemplateEnd
  | SpotTokenInt
  | SpotTokenFloat;
