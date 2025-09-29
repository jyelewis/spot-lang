import { AsyncLocalStorage } from 'node:async_hooks';
import { setTimeout } from 'timers/promises';
import assert from 'node:assert';
import { threadId } from 'node:worker_threads';

type ThreadFn = () => Promise<void>;
type ThreadHandle = {
  id: number;
  local_variables: Map<string, any>;
  promise: null | Promise<void>;
};

class ThreadModule {
  public asyncLocalStorage = new AsyncLocalStorage<number>();
  public next_thread_id = 0;
  public runningThreads = new Map<number, ThreadHandle>();

  constructor() {
    console.log('ThreadModule initialized');
  }

  // await EVERYTHING to avoid red/blue in our demos
  spawn(threadFn: ThreadFn): ThreadHandle {
    const threadId = this.next_thread_id;
    this.next_thread_id++;

    const threadHandle: ThreadHandle = {
      id: threadId,
      promise: null,
      // clone parent local variables if present
      local_variables: this.is_in_thread_context()
        ? new Map(this.current_thread().local_variables.entries())
        : new Map(),
    };
    this.runningThreads.set(threadId, threadHandle);

    // start the thread
    threadHandle.promise = this.asyncLocalStorage.run(threadId, threadFn);

    // clean up once it exits
    threadHandle.promise
      .then(() => {
        this.runningThreads.delete(threadId);
      })
      .catch(() => {
        this.runningThreads.delete(threadId);
      });

    return threadHandle;
  }

  is_in_thread_context(): boolean {
    const threadId = this.asyncLocalStorage.getStore();
    return threadId !== undefined;
  }

  current_thread_id(): number {
    const threadId = this.asyncLocalStorage.getStore();
    assert(threadId !== undefined, 'Not in thread context');
    assert(this.runningThreads.has(threadId), 'Thread not in running set...');

    return threadId;
  }

  current_thread(): ThreadHandle {
    const threadId = this.current_thread_id();
    return this.runningThreads.get(threadId)!;
  }

  async wait_for(threadHandle: ThreadHandle): Promise<void> {
    await threadHandle.promise;
  }

  get_thread_local_variable(name: string): any {
    return this.current_thread().local_variables.get(name);
  }

  set_thread_local_variable(name: string, value: any) {
    this.current_thread().local_variables.set(name, value);
  }
}
export const threadModule = new ThreadModule();

function print_thread_name() {
  console.log(
    'I am thread name:' +
      threadModule.get_thread_local_variable('name') +
      ' id:' +
      threadModule.current_thread_id()
  );
}

async function main() {
  const t1 = threadModule.spawn(async () => {
    threadModule.set_thread_local_variable('name', 'Thread 1');
    await setTimeout(300);
    print_thread_name();
  });

  const t2 = threadModule.spawn(async () => {
    threadModule.set_thread_local_variable('name', 'Thread 2');

    const childT2 = threadModule.spawn(async () => {
      threadModule.set_thread_local_variable('name', 'Thread 2 (child)');
      print_thread_name();
    });

    await setTimeout(400);
    print_thread_name();

    await threadModule.wait_for(childT2);
  });

  await threadModule.wait_for(t1);
  await threadModule.wait_for(t2);
}

// main().catch(console.error);
