import { Site, SiteFactory, type API } from "#swooce";
import IndexRouteDocumentSrcFactory from "./documents/index.ts";
import PostsRouteDocumentSrcFactory from "./documents/post.ts";
import BlogRouteDocumentSrcFactory from "./documents/blog.ts";

export default class extends SiteFactory {
  override async create(api: API): Promise<Site> {
    const indexRouteDocumentSrcFactory = new IndexRouteDocumentSrcFactory();
    const indexRouteDocumentSrc =
      await indexRouteDocumentSrcFactory.create(api);

    const blogRouteDocumentSrcFactory = new BlogRouteDocumentSrcFactory();
    const blogRouteDocumentSrc = await blogRouteDocumentSrcFactory.create(api);

    const postsRouteDocumentSrcFactory = new PostsRouteDocumentSrcFactory();
    const postsRouteDocumentSrcs =
      await postsRouteDocumentSrcFactory.create(api);

    const documentSrcs = [
      indexRouteDocumentSrc,
      blogRouteDocumentSrc,
      ...postsRouteDocumentSrcs,
    ];

    return new Site(documentSrcs);
  }
}
