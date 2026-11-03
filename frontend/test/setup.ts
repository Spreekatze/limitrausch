// This file is loaded before any test files are run, so we can set up global mocks here.
Object.assign(globalThis, {
  definePage: () => undefined,
});
