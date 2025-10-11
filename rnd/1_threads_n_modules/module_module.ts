import { threadModule } from './thread_module';

interface ModuleContainer {
  modules: Map<string, ModuleMetadata>;
}

class ModuleModule {
  constructor() {
    console.log('ModuleModule initialized');
  }

  init_empty_container_for_thread() {
    threadModule.current_thread().local_variables.set('module_container', {
      modules: new Map<string, ModuleMetadata>(),
    } as ModuleContainer);
  }

  get_module_container() {
    const moduleContainer = threadModule.get_thread_local_variable('module_container');
    if (!moduleContainer) {
      throw new Error(
        'Module container not initialized for this thread. Did you call init_empty_container_for_thread()?'
      );
    }

    return moduleContainer as ModuleContainer;
  }

  register_module(moduleMetadata: ModuleMetadata) {
    const moduleContainer = this.get_module_container();
    if (moduleContainer.modules.has(moduleMetadata.id)) {
      throw new Error(`Module ${moduleMetadata.id} already registered in container`);
    }

    for (const dep of moduleMetadata.deps) {
      if (dep.useCompatibleImplementation === undefined) {
        // handle no implementation provided case
        if (!moduleContainer.modules.has(dep.moduleId)) {
          throw new Error(
            `Dependency ${dep.moduleId} not found in container, and no implementation provided`
          );
        }

        // we're good, direct reference exists
        continue;
      }

      // handle implementation provided case
      // we already have an implementation for this dependency?
      if (moduleContainer.modules.has(dep.moduleId)) {
        // TODO: we'll need to allow overwriting when mocking stuff?
        // throw new Error('Conflicting implementations for dependency ' + dep.moduleId);
        console.warn(
          `Replacing existing implementation for dependency '${dep.moduleId}' with '${dep.useCompatibleImplementation}'`
        );
      }

      if (!moduleContainer.modules.has(dep.useCompatibleImplementation)) {
        throw new Error(
          `Provided implementation ${dep.useCompatibleImplementation} for dependency ${dep.moduleId} not found in container`
        );
      }

      // we've been provided an implementation, but it doesn't exist in the container
      // store it

      // copy the implementation under the interface key
      moduleContainer.modules.set(
        dep.moduleId,
        moduleContainer.modules.get(dep.useCompatibleImplementation)!
      );
    }

    moduleContainer.modules.set(moduleMetadata.id, moduleMetadata);
  }

  get_module(moduleId: ModuleId): ModuleMetadata {
    const moduleContainer = this.get_module_container();
    if (!moduleContainer.modules.has(moduleId)) {
      throw new Error(`Module ${moduleId} not found in container`);
    }

    return moduleContainer.modules.get(moduleId)!;
  }
}

const moduleModule = new ModuleModule();
type ModuleId = string; // internally references interfaces/modules we've seen

interface ModuleMetadata {
  id: ModuleId;
  deps: Array<{
    // cases
    // 1. Direct reference to another module
    // 2. Reference to an interface, no concrete implementation provided
    // 3. concrete module key, with alternate implementation provided
    // 4. interface key, with implementation provided
    moduleId: ModuleId;
    useCompatibleImplementation?: ModuleId; // for cases 3 and 4
  }>;

  methods: Record<string, (...args: any[]) => any>;
}

const userServiceModule: ModuleMetadata = {
  id: 'UserServiceModule',
  deps: [],
  methods: {
    getUserName: (userId: number) => {
      return `User${userId}`;
    },
  },
};

const userControllerModule: ModuleMetadata = {
  id: 'UserControllerModule',
  deps: [
    {
      moduleId: 'UserServiceModule',
    },
  ],
  methods: {
    getUserDisplayName: (userId: number) => {
      const userService = moduleModule.get_module('UserServiceModule');
      const userName = userService.methods.getUserName(userId);
      return `DisplayName: ${userName}`;
    },
  },
};

async function main() {
  // starting the service
  const t1 = threadModule.spawn(async () => {
    moduleModule.init_empty_container_for_thread();
    moduleModule.register_module(userServiceModule);
    moduleModule.register_module(userControllerModule);

    const ucModule = moduleModule.get_module('UserControllerModule');
    console.log(ucModule.methods.getUserDisplayName(42));
  });

  await threadModule.wait_for(t1);

  // running tests
  const testThread = threadModule.spawn(async () => {
    moduleModule.init_empty_container_for_thread();
    moduleModule.register_module(userServiceModule);
    moduleModule.register_module(userControllerModule);

    const mockUserServiceModule: ModuleMetadata = {
      id: 'MockUserServiceModule',
      deps: [],
      methods: {
        getUserName: () => {
          return `MockUserName!`;
        },
      },
    };
    moduleModule.register_module(mockUserServiceModule);

    const userControllerTestModule: ModuleMetadata = {
      id: 'UserControllerTestModule',
      deps: [
        {
          moduleId: 'UserServiceModule',
          useCompatibleImplementation: 'MockUserServiceModule',
        },
        {
          moduleId: 'UserControllerModule',
        },
      ],
      methods: {
        test1: () => {
          const userController = moduleModule.get_module('UserControllerModule');
          const userName = userController.methods.getUserDisplayName(999);
          return `userController.getUserDisplayName: ${userName}`;
        },
      },
    };
    moduleModule.register_module(userControllerTestModule);

    const testModule = moduleModule.get_module('UserControllerTestModule');
    console.log(testModule.methods.test1());
  });

  await threadModule.wait_for(testThread);
}

main().catch(console.error);
