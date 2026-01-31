import { Site, SiteFactory } from "#swooce";
import IndexPageFactory from "./pages/index.ts";

export default class extends SiteFactory {
  override createSite(): Site {
    const indexPageFactory = new IndexPageFactory();
    const indexPages = indexPageFactory.createPages();
    const sitePages = indexPages;
    return new Site(sitePages);
  }
}
