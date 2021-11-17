const jestNearley = require("jest-transform-nearley");
const tsJest = require("ts-jest");

module.exports.process = (source, filename, options) => {
  const typeScript = jestNearley.process(source, filename).code;

  return tsJest.default
    .createTransformer()
    .process(typeScript, filename.replace(/\.ne$/, ".ts"), options);
};
