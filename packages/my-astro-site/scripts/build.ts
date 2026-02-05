import {
  createAstroPipelineContext,
  runAstroPipeline,
} from "@swooce/framework-astro";

const packageJsonURL = new URL("../package.json", import.meta.url);

const myAstroPipelineContext = createAstroPipelineContext(packageJsonURL);
await runAstroPipeline(myAstroPipelineContext);
