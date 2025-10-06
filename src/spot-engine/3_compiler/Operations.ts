import { CodeLocation } from '../types';

export interface RegisterReference {
  index: number;
}

export interface FunctionCallOperation {
  type: 'function_call';
  location: CodeLocation;

  // TODO: will need scope etc
  functionName: string;
  parameterValues: RegisterReference[];
}

export interface LoadConstantOperation {
  type: 'load_constant';
  location: CodeLocation;

  targetRegister: RegisterReference;
  value: string | number; // TODO: need to point to structs in vm memory
}

export interface ClearRegisterOperation {
  type: 'clear_register';
  location: CodeLocation;

  register: RegisterReference;
}

export interface StringConcatenateOperation {
  type: 'string_concatenate';
  location: CodeLocation;

  targetRegister: RegisterReference;
  partRegisters: RegisterReference[];
}

export interface ArithmeticOperation {
  type: 'arithmetic';
  location: CodeLocation;

  targetRegister: RegisterReference;
  leftRegister: RegisterReference;
  operator: '+' | '-' | '*' | '/';
  rightRegister: RegisterReference;
}

export type Operation =
  | FunctionCallOperation
  | LoadConstantOperation
  | ClearRegisterOperation
  | StringConcatenateOperation
  | ArithmeticOperation;
