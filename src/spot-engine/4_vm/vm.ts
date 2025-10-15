import { SpotApplication } from '../3_compiler/compiler';
import { VMError } from './VMError';
import { RegisterReference } from '../3_compiler/Operations';

export async function executeApplicationAndCaptureOutput(
  application: SpotApplication
): Promise<string> {
  const vm = new SpotVM(application);

  const output: string[] = [];
  vm.printFn = (str: string) => {
    output.push(str);
  };

  await vm.executeFunction('main', 'main', []);

  return output.join('\n');
}

export async function executeApplication(application: SpotApplication): Promise<void> {
  const vm = new SpotVM(application);
  await vm.executeFunction('main', 'main', []);
}

export class SpotVM {
  registers = new Map<number, string | number | boolean>();

  constructor(public readonly application: SpotApplication) {}

  public printFn = (str: string) => {
    console.log(str);
  };

  async executeFunction(
    moduleName: string,
    functionName: string,
    parameters: RegisterReference[]
  ): Promise<void> {
    const module = this.application.modules[moduleName];
    if (module === undefined) {
      throw new VMError(`No such module '${moduleName}'`);
    }

    const func = module.functions[functionName];
    if (func === undefined) {
      throw new VMError(`No such function '${moduleName}' in module ${moduleName}`);
    }

    if ('intrinsic' in func) {
      this.executeIntrinsicFunction(func.intrinsic, parameters);
      return;
    }

    // execute bytecode operations
    let operationIndex = 0;
    while (operationIndex < func.operations.length) {
      const operation = func.operations[operationIndex];
      switch (operation.type) {
        case 'load_constant':
          this.registers.set(operation.targetRegister.index, operation.value);
          break;
        case 'clear_register':
          this.registers.delete(operation.register.index);
          break;
        case 'function_call':
          await this.executeFunction(
            'std', // TODO: hardcoded
            operation.functionName,
            operation.parameterValues
          );
          break;
        // TODO: we're going to want to come back and make this an overloadable struct value
        case 'string_concatenate': {
          let concatenatedResult = '';
          for (const partRegister of operation.partRegisters) {
            const partValue = this.registers.get(partRegister.index);
            if (partValue === undefined) {
              throw new VMError(`Register ${partRegister.index} is empty`);
            }
            concatenatedResult += String(partValue);
          }
          this.registers.set(operation.targetRegister.index, concatenatedResult);
          break;
        }
        // TODO: also to become an implementation method later - although we need intrinsics at some point
        case 'arithmetic': {
          const leftValue = this.registers.get(operation.leftRegister.index);
          const rightValue = this.registers.get(operation.rightRegister.index);

          if (leftValue === undefined) {
            throw new VMError(`Register ${operation.leftRegister.index} is empty`);
          }
          if (rightValue === undefined) {
            throw new VMError(`Register ${operation.rightRegister.index} is empty`);
          }

          // Ensure both values are numbers
          if (typeof leftValue !== 'number' || typeof rightValue !== 'number') {
            throw new VMError(`Arithmetic operations require numeric operands`);
          }

          let result: number;
          switch (operation.operator) {
            case '+':
              result = leftValue + rightValue;
              break;
            case '-':
              result = leftValue - rightValue;
              break;
            case '*':
              result = leftValue * rightValue;
              break;
            case '/':
              result = leftValue / rightValue;
              break;
            default:
              throw new VMError(`Unknown arithmetic operator: ${(operation as any).operator}`);
          }

          this.registers.set(operation.targetRegister.index, result);
          break;
        }
        case 'unary': {
          const operandValue = this.registers.get(operation.operandRegister.index);

          if (operandValue === undefined) {
            throw new VMError(`Register ${operation.operandRegister.index} is empty`);
          }

          let result: boolean | number;
          switch (operation.operator) {
            case '!':
              // Boolean negation
              if (typeof operandValue === 'boolean') {
                result = !operandValue;
              } else {
                throw new VMError(
                  `Boolean negation requires a boolean operand, got ${typeof operandValue}`
                );
              }
              break;
            case '-':
              // Numeric negation
              if (typeof operandValue === 'number') {
                result = -operandValue;
              } else {
                throw new VMError(
                  `Numeric negation requires a numeric operand, got ${typeof operandValue}`
                );
              }
              break;
            default:
              throw new VMError(`Unknown unary operator: ${(operation as any).operator}`);
          }

          this.registers.set(operation.targetRegister.index, result);
          break;
        }
        case 'conditional_jump': {
          const conditionValue = this.registers.get(operation.conditionRegister.index);

          if (conditionValue === undefined) {
            throw new VMError(`Register ${operation.conditionRegister.index} is empty`);
          }

          if (typeof conditionValue !== 'boolean') {
            throw new VMError(
              `Conditional jump requires a boolean condition, got ${typeof conditionValue}`
            );
          }

          // Jump if condition is false (inverted logic for easier compilation)
          if (!conditionValue) {
            operationIndex = operation.jumpToOperation;
            continue; // Skip the increment at the end of the loop
          }
          break;
        }
        case 'unconditional_jump': {
          operationIndex = operation.jumpToOperation;
          continue; // Skip the increment at the end of the loop
        }
        case 'label': {
          // Labels are no-op at runtime, just continue
          break;
        }
        default:
          throw new VMError(`Unimplemented operation type: ${(operation as any).type}`);
      }

      operationIndex++; // Move to next operation
    }
  }

  executeIntrinsicFunction(intrinsicName: string, parameters: RegisterReference[]): void {
    if (intrinsicName === 'print') {
      if (parameters.length !== 1) {
        throw new VMError('intrinsic "print" takes exactly one parameter');
      }
      const param = parameters[0];
      const value = this.registers.get(param.index);
      if (value === undefined) {
        throw new VMError(`Register ${param.index} is empty`);
      }
      // console.log('[intrinsic print]', value);
      this.printFn(String(value));
      return;
    }

    throw new Error('intrinsic not implemented.');
  }
}
