import { writeSiteToFs } from "@swooce/core";
import { createSite, createSiteContext } from "@swooce/framework-astro";

const myAstroSiteContext = createSiteContext(
  new URL("../package.json", import.meta.url),
);
const myAstroSite = await createSite(myAstroSiteContext);
await writeSiteToFs(myAstroSiteContext, myAstroSite);
