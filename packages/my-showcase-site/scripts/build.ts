import {
  createShowcasePipelineContext,
  runShowcasePipeline,
} from "../src/pipeline.ts";

const myShowcasePipelineContext = createShowcasePipelineContext(
  new URL("../package.json", import.meta.url),
);
const runMyShowcasePipeline = runShowcasePipeline;
runMyShowcasePipeline(myShowcasePipelineContext);
