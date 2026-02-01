import { Site, SiteFactory, type CommonAPI } from "#swooce";
import IndexRoutePageFactory from "./pages/index.ts";
import PostsRoutePageFactory from "./pages/post.ts";
import BlogRoutePageFactory from "./pages/blog.ts";

export default class extends SiteFactory {
  override async create(api: CommonAPI): Promise<Site> {
    const indexRoutePageFactory = new IndexRoutePageFactory();
    const indexRoutePages = await indexRoutePageFactory.create(api);

    const blogRoutePageFactory = new BlogRoutePageFactory();
    const blogRoutePages = await blogRoutePageFactory.create(api);

    const postsRoutePageFactory = new PostsRoutePageFactory();
    const postsRoutePages = await postsRoutePageFactory.create(api);

    const pages = [indexRoutePages, blogRoutePages, ...postsRoutePages];

    return new Site(pages);
  }
}
