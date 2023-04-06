import { Config } from "jest"
const es_modules = ['@react-leaflet', 'react-leaflet'].join('|');

//<rootDir> = /src/client/
const config: Config = {
  displayName: "frontend",
  preset: "ts-jest",
  transform: {
    "\\.[jt]sx?$": "ts-jest",
  },
  transformIgnorePatterns: [`/node_modules/(?!${es_modules})`],
  moduleNameMapper: {
    "^uuid$": "<rootDir>/../../node_modules/uuid",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/../__mocks__/file_mock.ts",
    "\\.(css|less)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "<rootDir>/test_setup.ts",
  ],
  snapshotSerializers: [
    '@emotion/jest/serializer'
  ],
  testEnvironment: "jsdom",
}

export default config
