import { buildSite } from "@swooce/core";
import { createSite, createSiteContext } from "@swooce/framework-astro";

const myAstroSiteContext = createSiteContext(
  new URL("../package.json", import.meta.url),
);
const myAstroSite = createSite();
await buildSite(myAstroSiteContext, myAstroSite);
