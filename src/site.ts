import { SrcSite, SrcSiteFactory, type CommonAPI } from "#swooce";
import IndexRouteDocumentFactory from "./documents/index.ts";
import PostsRouteDocumentFactory from "./documents/post.ts";
import BlogRouteDocumentFactory from "./documents/blog.ts";

export default class extends SrcSiteFactory {
  override async create(api: CommonAPI): Promise<SrcSite> {
    const indexRouteSrcDocumentFactory = new IndexRouteDocumentFactory();
    const indexRouteSrcDocument =
      await indexRouteSrcDocumentFactory.create(api);

    const blogRouteSrcDocumentFactory = new BlogRouteDocumentFactory();
    const blogRouteSrcDocument = await blogRouteSrcDocumentFactory.create(api);

    const postsRouteSrcDocumentFactory = new PostsRouteDocumentFactory();
    const postsRouteSrcDocuments =
      await postsRouteSrcDocumentFactory.create(api);

    const srcDocuments = [
      indexRouteSrcDocument,
      blogRouteSrcDocument,
      ...postsRouteSrcDocuments,
    ];

    return new SrcSite(srcDocuments);
  }
}
