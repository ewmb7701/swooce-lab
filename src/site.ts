import { Site, SiteFactory, type API } from "#swooce";
import IndexRouteDocumentFactory from "./document/index.ts";
import PostsRouteDocumentFactory from "./document/post.ts";
import BlogRouteDocumentFactory from "./document/blog.ts";

export default class extends SiteFactory {
  override async create(api: API): Promise<Site> {
    const indexRouteDocumentFactory = new IndexRouteDocumentFactory();
    const indexRouteDocument = await indexRouteDocumentFactory.create(api);

    const blogRouteDocumentFactory = new BlogRouteDocumentFactory();
    const blogRouteDocument = await blogRouteDocumentFactory.create(api);

    const allPostRouteDocumentFactory = new PostsRouteDocumentFactory();
    const allPostRouteDocument = await allPostRouteDocumentFactory.create(api);

    const allDocument = [
      indexRouteDocument,
      blogRouteDocument,
      ...allPostRouteDocument,
    ];

    return new Site(allDocument);
  }
}
