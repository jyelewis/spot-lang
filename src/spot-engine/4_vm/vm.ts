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
  registers = new Map<number, string>();

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
    for (const operation of func.operations) {
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
        default:
          throw new VMError(`Unimplemented operation type: ${(operation as any).type}`);
      }
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
      this.printFn(value);
      return;
    }

    throw new Error('intrinsic not implemented.');
  }
}
