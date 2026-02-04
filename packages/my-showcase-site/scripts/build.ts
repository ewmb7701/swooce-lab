import {
  createShowcasePipelineContext,
  ShowcasePipeline,
} from "../src/pipeline.ts";

const myShowcasePipelineContext = createShowcasePipelineContext(
  new URL("../package.json", import.meta.url),
);
const myShowcasePipeline = new ShowcasePipeline();
myShowcasePipeline.run(myShowcasePipelineContext);
