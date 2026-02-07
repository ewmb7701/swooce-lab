// /scripts/start.ts
import { default as express } from "express";
import { createSiteContext, createSite } from "../src/site.ts";
import { createSiteIndex } from "swooce";
import { createMiddleware } from "@swooce/express";

const myShowcaseSiteContext = createSiteContext(
  new URL("../package.json", import.meta.url),
);
const myShowcaseSite = createSite();
const myShowcaseSiteIndex = await createSiteIndex(
  myShowcaseSiteContext,
  myShowcaseSite,
);

const myShowcaseSiteMiddleware = createMiddleware(
  myShowcaseSiteContext,
  myShowcaseSiteIndex,
);

const app = express();
app.use(myShowcaseSiteMiddleware);
app.use((_req, res) => {
  res.status(404).send("Not Found");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`swooce dev server running at http://localhost:${PORT}`);
});
