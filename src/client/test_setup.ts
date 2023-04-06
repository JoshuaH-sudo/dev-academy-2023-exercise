import server from '../__mocks__/server'

global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

beforeAll(() => {
  // Enable the mocking in tests.
  server.listen()
})

afterEach(() => {
  // Reset any runtime handlers tests may use.
  jest.restoreAllMocks()
  server.resetHandlers()
})

afterAll(() => {
  // Clean up once the tests are done.
  server.close()
})