export type PendingExecutions = [any, any, any[]][]; // ? [ [fn,scope,args,]]

class Class {
  #isRunning = false;
  #pendingExecutions: PendingExecutions = [];

  #startExecution = async () => {
    if (!this.#pendingExecutions.length) {
      this.#isRunning = false;
      return;
    }

    const group = this.#pendingExecutions[0];
    await group[0].call(group[1], ...group[2]);

    this.#pendingExecutions.shift();

    this.#startExecution();
  };

  schedule(fn: any, scope: any, ...args: any[]) {
    this.#pendingExecutions.push([fn, scope, args]);

    if (!this.#isRunning) {
      this.#isRunning = true;
      this.#startExecution();
    }
  }
}

const PromiseQueue = new Class();

Object.freeze(PromiseQueue);

export { PromiseQueue };
