import { CodeLocation } from '../1_tokeniser/types';

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
  value: string; // TODO: need to point to structs in vm memory
}

export interface ClearRegisterOperation {
  type: 'clear_register';
  location: CodeLocation;

  register: RegisterReference;
}

export type Operation = FunctionCallOperation | LoadConstantOperation | ClearRegisterOperation;
