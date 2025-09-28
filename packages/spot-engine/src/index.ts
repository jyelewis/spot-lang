/**
 * Spot Language Engine - Main Entry Point
 * A hobby programming language implementation
 */

/**
 * Simple greeting function to demonstrate the engine
 */
export function greet(name: string = 'World'): string {
  return `Hello, ${name}! Welcome to the Spot programming language.`;
}

/**
 * Engine class to handle Spot language operations
 */
export class SpotEngine {
  private version: string = '0.1.0';

  constructor() {
    console.log(`Spot Engine v${this.version} initialized`);
  }

  /**
   * Get the engine version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Execute a simple greeting (placeholder for actual language execution)
   */
  execute(name?: string): string {
    return greet(name);
  }
}

/**
 * Main function - entry point when running directly
 */
function main(): void {
  console.log('🔴 Spot Language Engine Starting...');

  const engine = new SpotEngine();
  const result = engine.execute();

  console.log(result);
  console.log('🔴 Spot Language Engine Ready!');
}

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}
