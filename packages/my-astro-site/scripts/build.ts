import { writeSiteToFs } from "@swooce/core";
import { createSite, createSiteContext } from "@swooce/framework-astro";

const myAstroSiteContext = createSiteContext(
  new URL("../package.json", import.meta.url),
);
const myAstroSite = createSite();
await writeSiteToFs(myAstroSiteContext, myAstroSite);
