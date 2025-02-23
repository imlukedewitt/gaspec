# GAS Testing Framework

A simple testing framework for Google Apps Script that supports both Node.js and GAS environments. Inspired by [UnitTestingApp](https://github.com/WildH0g/UnitTestingApp).

## Getting Started

1. Create test files in the `test/helpers` directory
2. Create `test-runner.js` in the `test` directory
3. Import your test files in `test-runner.js`
4. Queue your tests in the TestRunner's start method

## Writing Tests

Example test file:
```javascript
const MyClassTest = (() => {
  function queue() {
    // Specify if tests should run in GAS environment or Node.js
    runInGas(true);
    
    // Add a header for test organization
    printHeader('path/to/tested/file.js');

    describe('MyFunction', () => {
      it('does something specific', () => {
        const result = MyClass.doSomething();
        expect(result).toBe(true);
      });
    });
  }

  return { queue };
})();

// Handle Node.js environment
if (typeof module !== 'undefined') {
  MyClass = require('./path/to/tested/file.js');
  module.exports = MyClassTest;
}
```

Example test runner:
```javascript
// Import dependencies if running in Node.js
if (typeof require !== "undefined") {
  Tester = require('../lib/gaspec/tester.js');
  MyClassTest = require('./path/to/myclass.test.js');
  MyFunctionTest = require('./path/to/myfunction.test.js');
}

const TestRunner = (() => {
  return {
    start() {
      // Create tester instance and setup environment
      const tester = Tester.setup();

      // Queue tests
      MyClassTest.queue();
      MyFunctionTest.queue();

      // Run tests
      tester.run();
    }
  }
})();

// Export for Node.js
if (typeof module !== "undefined") TestRunner.start();
```

## Available Matchers

The framework provides the following matchers:

- `toBe(value)` - Strict equality (===)
- `toEqual(value)` - Loose equality (==)
- `toEqualObject(obj)` - Deep object comparison
- `toContain(value)` - Check if array/string contains value
- `toBeTruthy()` - Check if value is truthy
- `toBeFalsy()` - Check if value is falsy
- `toBeNull()` - Check if value is null
- `toBeUndefined()` - Check if value is undefined
- `toBeGreaterThan(value)` - Numeric comparison
- `toBeLessThan(value)` - Numeric comparison
- `toThrowError([message])` - Check if function throws error
- `toRespondTo(methodName)` - Check if object has method
- `toBeInstanceOf(className)` - Check instance type

All matchers can be negated using `.not`:
```javascript
expect(value).not.toBe(false);
```

## Test Organization

Use these functions to structure your tests:

- `describe(description, fn)` - Group related tests
- `context(description, fn)` - Alias for describe, for readability
- `it(description, fn)` - Individual test case
- `printHeader(message)` - Log section headers
- `runInGas(boolean)` - Specify test environment

## Environment Control

Control which environment your tests run in:

```javascript
// Run the following tests if the environment is Google Apps Script
runInGas(true);

// Run the following tests if the environment is Node.js
runInGas(false);
```

## Example Test Structure

```javascript
describe('Feature Group', () => {
  context('Specific Feature', () => {
    it('handles normal case', () => {
      // test code
    });

    it('handles edge case', () => {
      // test code
    });
  });
});
```

Tests will display with checkmarks (✔️) for passing tests and crosses (❌) for failing tests, including error messages for failures.

## Running Tests

### Google Apps Script

1. Add a new script file in the Google Apps Script editor
2. Add a function that calls `TestRunner.start()`
3. Run the function in the Apps Script web editor

### Node.js

1. Run `node path/to/test-runner.js` in the terminal