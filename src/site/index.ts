import { Site, SiteFactory } from "#swooce";
import IndexRoutePageFactory from "./routes/index.ts";

export default class extends SiteFactory {
  override create(): Site {
    const indexRoutePageFactory = new IndexRoutePageFactory();
    const indexRoutePages = indexRoutePageFactory.create();
    const sitePages = indexRoutePages;
    return new Site(sitePages);
  }
}
