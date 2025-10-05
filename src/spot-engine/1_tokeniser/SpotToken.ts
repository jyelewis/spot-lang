import { CodeLocation } from '../types';

// comment: '// this is a comment'
// keyword: func, let, if, else, return, null
// symbol: "(" "{" ","
// identifier: hello_world
// StringTemplateStart
// StringLiteral: "Hello world!"
// StringTemplateExpressionStart
// StringTemplateExpressionEnd
// StringTemplateEnd
// int: 123
// float: 45.67

export interface SpotTokenComment {
  type: 'comment';
  location: CodeLocation;

  comment: string;
}

export const spotKeywords = ['func', 'let', 'if', 'else', 'return', 'null'] as const;
type SpotKeyword = (typeof spotKeywords)[number];

export interface SpotTokenKeyword {
  type: 'keyword';
  location: CodeLocation;

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
export interface SpotTokenSymbol {
  type: 'symbol';
  location: CodeLocation;

  symbol: SpotSymbol;
}

export interface SpotTokenIdentifier {
  type: 'identifier';
  location: CodeLocation;

  identifier: string;
}

export interface SpotTokenStringTemplateStart {
  type: 'string_template_start';
  location: CodeLocation;
}

export interface SpotTokenStringLiteral {
  type: 'string_literal';
  location: CodeLocation;

  literal: string;
}

export interface SpotTokenStringTemplateExpressionStart {
  type: 'string_template_expression_start';
  location: CodeLocation;
}

export interface SpotTokenStringTemplateExpressionEnd {
  type: 'string_template_expression_end';
  location: CodeLocation;
}

export interface SpotTokenStringTemplateEnd {
  type: 'string_template_end';
  location: CodeLocation;
}

export interface SpotTokenInt {
  type: 'int';
  location: CodeLocation;

  int: number;
}

export interface SpotTokenFloat {
  type: 'float';
  location: CodeLocation;

  float: number;
}

export type SpotTokenType = SpotToken['type'];

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
