import {
  AstroPipeline,
  createAstroPipelineContext,
} from "@swooce/framework-astro";

const packageJsonURL = new URL("../package.json", import.meta.url);

const myAstroPipelineContext = createAstroPipelineContext(packageJsonURL);
const myAstroPipeline = new AstroPipeline();
await myAstroPipeline.run(myAstroPipelineContext);
