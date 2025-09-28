import { greet, SpotEngine } from '../src/index';

describe('SpotEngine', () => {
  describe('greet function', () => {
    it('should return a greeting with default name', () => {
      const result = greet();
      expect(result).toBe('Hello, World! Welcome to the Spot programming language.');
    });

    it('should return a greeting with custom name', () => {
      const result = greet('Alice');
      expect(result).toBe('Hello, Alice! Welcome to the Spot programming language.');
    });
  });

  describe('SpotEngine class', () => {
    let engine: SpotEngine;

    beforeEach(() => {
      // Suppress console.log during tests
      jest.spyOn(console, 'log').mockImplementation();
      engine = new SpotEngine();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should initialize with correct version', () => {
      expect(engine.getVersion()).toBe('0.1.0');
    });

    it('should execute and return greeting', () => {
      const result = engine.execute('Test');
      expect(result).toBe('Hello, Test! Welcome to the Spot programming language.');
    });

    it('should execute with default greeting', () => {
      const result = engine.execute();
      expect(result).toBe('Hello, World! Welcome to the Spot programming language.');
    });
  });
});
