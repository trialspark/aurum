import { InitialOptionsTsJest } from "ts-jest/dist/types";
import "jest";

const config: InitialOptionsTsJest = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
  moduleFileExtensions: ["js", "ts", "ne"],
  transform: {
    "^.+\\.ne$": "<rootDir>/nearley-jest-ts.js",
  },
  testPathIgnorePatterns: ["/node_modules/", "/build/"],
};

export default config;
