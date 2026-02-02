import { ModuleResolver, type Context } from "swooce";
import { ContentModule } from "@swooce/core";
import { HelloSiteModule } from "@swooce/site-hello";
import type { Document } from "happy-dom";
import PageModuleResolver from "./site/pages.ts";
import StaticModuleResolver from "./site/public.ts";

export default class extends ModuleResolver<HelloSiteModule> {
  override async resolve(ctx: Context) {
    const pagesModuleResolver = new PageModuleResolver();
    const allPageModule = (await pagesModuleResolver.resolve(ctx)) as Array<
      ContentModule<Document>
    >;

    const publicModuleResolver = new StaticModuleResolver();
    const allAssetModule = await publicModuleResolver.resolve(ctx);

    return new HelloSiteModule(
      new URL(import.meta.url),
      allPageModule,
      allAssetModule,
    );
  }
}
