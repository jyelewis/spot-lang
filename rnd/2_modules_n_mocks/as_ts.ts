interface Variable {
  name: string;
  mutable: boolean;
  type: string; // "string", "int", "bool", "float", "
  value: any; // "hello", 123, true, 3.14, ...
}

interface Annotation {
  name: string;
  arguments: any[];
}

interface FunctionDef {
  name: string; // "sendEmail"
  annotations: Annotation[];
  parameters: { name: string; type: string; annotations: Annotation[] }[]; // [{ name: "to", type: "string" }, ...]
  returnType: string; // "void", "string", "int", ...
  body: unknown;
}

interface Struct {
  name: string;
  fields: { name: string; type: string; annotations: Annotation[] }[]; // [{ name: "subject", type: "string" }, ...]
  annotations: Annotation[];

  // when accessing imports, variables, etc. from this structs functions, use this module_id to resolve where it comes from
  module_id: string;
}

// - UserService
// - UserRepository
// - EmailService
// - PhotosBucket
// - PrpLogger
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Module {
  id: string; // "com.jyelewis.EmailService"
  name: string; // "EmailService"
  imports: Array<{
    module_id: string; // "com.jyelewis.Logging"
    implementation_module_id?: string; // "com.jyelewis.ConsoleLogging"
  }>;
  elements: {
    variables: Variable[];
    functions: FunctionDef[];
    structs: Struct[];
  };
}
