const Tester = (() => {
  const _runningInGas = new WeakMap();

  class Tester {
    static setup() {
      const tester = new Tester();
      tester.runInGas(false);
      globalThis.describe = tester.describe.bind(tester);
      globalThis.context = tester.context.bind(tester);
      globalThis.it = tester.it.bind(tester);
      globalThis.expect = tester.expect.bind(tester);
      globalThis.run = tester.run.bind(tester);
      return tester;
    }

    constructor() {
      this.rootGroup = new TestGroup('root');
      this.currentGroup = this.rootGroup;
    }

    get isInGas() {
      return typeof ScriptApp !== 'undefined';
    }

    get runningInGas() {
      return _runningInGas.get(this);
    }

    runInGas(bool = true) {
      _runningInGas.set(this, bool);
    }

    evironmentMismatch() {
      return this.isInGas !== this.runningInGas;
    }

    describe(description, fn) {
      if (this.evironmentMismatch()) return;

      const newGroup = new TestGroup(description, this.currentGroup);
      this.currentGroup.groups.push(newGroup);
      const previousGroup = this.currentGroup;
      this.currentGroup = newGroup;
      fn();
      this.currentGroup = previousGroup;
    }

    context(description, fn) {
      this.describe(description, fn);
    }

    it(description, fn) {
      this.currentGroup.tests.push({ description, fn });
    }

    expect(actual) {
      return new Expectation(actual);
    }

    runGroup(group, level = 0) {
      if (group !== this.rootGroup) {
        if (level === 1) {
          console.log(`Describe "${group.description}"`);
        } else {
          console.log("  ".repeat(level - 1) + group.description);
        }
      }

      group.tests.forEach(({ description, fn }) => {
        try {
          fn();
          console.log("  ".repeat(level) + `✔️  ${description}`);
        } catch (error) {
          console.error("  ".repeat(level) + `❌  ${description}`);
          console.error("  ".repeat(level + 1) + `${error.message}`);
        }
      });

      group.groups.forEach(subgroup => {
        this.runGroup(subgroup, level + 1);
      });
    }

    run() {
      this.runGroup(this.rootGroup);
    }
  }

  class TestGroup {
    constructor(description, parent = null) {
      this.description = description;
      this.parent = parent;
      this.groups = [];
      this.tests = [];
    }
  }

  class Expectation {
    constructor(actual) {
      this.actual = actual;
    }

    toBe(expected) {
      if (this.actual !== expected) {
        throw new Error(`Expected ${this.actual} to be ${expected}`);
      }
    }

    toEqual(expected) {
      if (this.actual != expected) {
        throw new Error(`Expected ${this.actual} to equal ${expected}`);
      }
    }

    toEqualObject(expected) {
      if (typeof this.actual !== 'object' || typeof expected !== 'object') {
        throw new Error('Actual and expected must be objects');
      }

      if (Object.keys(this.actual).length !== Object.keys(expected).length) {
        throw new Error('Actual and expected do not have the same number of keys');
      }

      const differences = [];
      const allKeys = new Set([...Object.keys(this.actual), ...Object.keys(expected)]);
      allKeys.forEach(key => {
        if (this.actual[key] !== expected[key]) {
          differences.push({ key, actual: this.actual[key], expected: expected[key] });
        }
      });

      if (differences.length > 0) {
        const message = differences.map(({ key, actual, expected }) => {
          return `${key}: expected ${actual} to equal ${expected}`;
        }).join('\n');
        throw new Error(message);
      }
    }

    toBeTruthy() {
      if (!this.actual) {
        throw new Error(`Expected ${this.actual} to be truthy`);
      }
    }

    toBeFalsy() {
      if (this.actual) {
        throw new Error(`Expected ${this.actual} to be falsy`);
      }
    }
  }

  return Tester;
})();

if (typeof module !== 'undefined') module.exports = Tester;
