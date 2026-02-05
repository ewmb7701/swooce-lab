import { buildSite } from "@swooce/core";
import { createSiteContext, createSite } from "../src/site.ts";

const myShowcaseSiteContext = createSiteContext(
  new URL("../package.json", import.meta.url),
);
const myShowcaseSite = createSite();
await buildSite(myShowcaseSiteContext, myShowcaseSite);
