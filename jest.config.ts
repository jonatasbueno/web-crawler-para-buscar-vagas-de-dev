/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  coverageDirectory: 'coverage',
  // Cobertura focada no núcleo testável (domínio, casos de uso, parsers,
  // repositório, notificador e scrapers HTTP). Excluídos: wiring/CLI, conexão e
  // migrations de banco, e as fontes que dependem de navegador headless
  // (Playwright) — testadas de forma best-effort em integração, não unitária.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/interface/**',
    '!src/infrastructure/persistence/connection.ts',
    '!src/infrastructure/persistence/migrate.ts',
    '!src/infrastructure/persistence/migrations/**',
    '!src/infrastructure/http/BrowserClient.ts',
    '!src/infrastructure/scrapers/registry.ts',
    '!src/infrastructure/scrapers/support/spaSupport.ts',
    '!src/infrastructure/scrapers/solides.ts',
    '!src/infrastructure/scrapers/workana.ts',
    '!src/infrastructure/scrapers/coodesh.ts',
    '!src/infrastructure/scrapers/trampos.ts',
    '!src/infrastructure/scrapers/indeed.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
