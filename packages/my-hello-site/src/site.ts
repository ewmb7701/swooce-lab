import { HelloSiteModule } from "@swooce/site-hello";
import { ModuleResolver, type API } from "swooce";
import IndexRouteModuleResolver from "./pages/index.ts";
import PostRouteModuleResolver from "./pages/post.ts";
import BlogRouteModuleResolver from "./pages/blog.ts";

export default class extends ModuleResolver<HelloSiteModule> {
  override async resolve(api: API) {
    const indexRouteModuleResolver = new IndexRouteModuleResolver();
    const indexRouteDocument = await indexRouteModuleResolver.resolve(api);

    const blogRouteModuleResolver = new BlogRouteModuleResolver();
    const blogRouteDocument = await blogRouteModuleResolver.resolve(api);

    const postRouteModuleResolver = new PostRouteModuleResolver();
    const postRouteDocument = await postRouteModuleResolver.resolve(api);

    const allPageModule = [
      indexRouteDocument,
      blogRouteDocument,
      ...postRouteDocument,
    ];

    return new HelloSiteModule(new URL(import.meta.url), allPageModule);
  }
}
