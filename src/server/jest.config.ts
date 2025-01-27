import type { Config } from "jest"

const config: Config = {
  displayName: "backend",
  preset: "@shelf/jest-mongodb",
  transform: {
    "\\.[jt]sx?$": "ts-jest",
  },
  moduleNameMapper: {
    "^uuid$": "<rootDir>/../../node_modules/uuid",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "<rootDir>/../__mocks__/file_mock.js",
    "\\.(css|less)$": "identity-obj-proxy",
  },
  setupFilesAfterEnv: ["<rootDir>/test_setup.ts"],
}

export default config
