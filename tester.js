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
      globalThis.runInGas = tester.runInGas.bind(tester);
      globalThis.tester = tester;
      globalThis.printHeader = tester.printHeader.bind(tester);
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
        console.log("  ".repeat(level - 1) + group.description);
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

    printHeader(message) {
      if (this.evironmentMismatch()) return;
      const line = '='.repeat(message.length + 8);
      const header = `\n${line}\n#   ${message}   #\n${line}\n`;
      this.describe(header, () => { });
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
    constructor(actual, negated = false) {
      this.actual = actual;
      this.negated = negated;
    }

    get not() {
      return new Expectation(this.actual, !this.negated);
    }

    _assert(condition, {
      message = `${this.actual}`,
      verb = 'to be',
      expected = ''
    }) {
      if (this.negated ? condition : !condition) {
        const verbText = `${this.negated ? 'not ' : ''}${verb}`;
        throw new Error(`Expected ${message} ${verbText} ${expected}`);
      }
    }

    toBe(expected) {
      this._assert(this.actual === expected, { expected });
    }

    toEqual(expected) {
      this._assert(this.actual == expected, { expected, verb: 'to equal' });
    }

    toEqualObject(expected) {
      if (typeof this.actual !== 'object' || typeof expected !== 'object') {
        throw new Error('Actual and expected must be objects');
      }

      const deepCompare = (obj1, obj2, path = '') => {
        const diffs = [];

        if (typeof obj1 !== typeof obj2) {
          return [`${path}: type mismatch ${typeof obj1} !== ${typeof obj2}`];
        }

        if (typeof obj1 === 'object' && obj1 !== null) {
          Object.keys({ ...obj1, ...obj2 }).forEach(key => {
            const newPath = path ? `${path}.${key}` : key;
            if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
              diffs.push(...deepCompare(obj1[key], obj2[key], newPath));
            } else if (obj1[key] !== obj2[key]) {
              diffs.push(`${newPath}: ${obj1[key]} !== ${obj2[key]}`);
            }
          });
          return diffs;
        }

        return obj1 !== obj2 ? [`${path}: ${obj1} !== ${obj2}`] : [];
      };

      const diffs = deepCompare(this.actual, expected);

      this._assert(diffs.length === 0, {
        verb: 'to match',
        message: 'objects',
        expected: diffs.length ? '\n' + diffs.join('\n') : ''
      });
    }

    toContain(expected) {
      if (!this.actual || typeof this.actual.includes !== 'function') {
        throw new Error('Actual value must be an array or string');
      }

      this._assert(this.actual.includes(expected), { expected, verb: 'to contain' });
    }

    toBeTruthy() { this._assert(this.actual, { verb: 'to be truthy' }); }

    toBeFalsy() { this._assert(!this.actual, { verb: 'to be falsy' }); }

    toBeNull() { this._assert(this.actual === null, { verb: 'to be null' }); }

    toBeUndefined() { this._assert(this.actual === undefined, { verb: 'to be undefined' }); }

    toBeGreaterThan(expected) { this._assert(this.actual > expected, { expected, verb: 'to be greater than' }); }

    toBeLessThan(expected) { this._assert(this.actual < expected, { expected, verb: 'to be less than' }); }

    toThrowError(errorText = null) {
      try {
        this.actual();
        this._assert(false, { verb: 'to throw an error' });
      } catch (error) {
        if (errorText) {
          this._assert(error.message === errorText, { verb: 'to throw an error', expected: errorText });
        }
      }
    }

    toRespondTo(methodName) {
      this._assert(typeof this.actual[methodName] === 'function', { verb: 'to respond to', expected: methodName });
    }

    toBeInstanceOf(expected) {
      this._assert(String(this.actual) === expected, { verb: 'to be an instance of', expected: expected });
    }
  }

  return Tester;
})();

if (typeof module !== 'undefined') module.exports = Tester;
