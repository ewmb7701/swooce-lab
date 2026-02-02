import { ArtifactResolver, type Context } from "swooce";
import { ContentArtifact } from "@swooce/core";
import { HelloSiteArtifact } from "@swooce/site-hello";
import type { Document } from "happy-dom";
import PageArtifactResolver from "./site/pages.ts";
import StaticArtifactResolver from "./site/public.ts";

export default class extends ArtifactResolver<HelloSiteArtifact> {
  override async resolve(ctx: Context) {
    const pagesArtifactResolver = new PageArtifactResolver();
    const allPageArtifact = (await pagesArtifactResolver.resolve(ctx)) as Array<
      ContentArtifact<Document>
    >;

    const publicArtifactResolver = new StaticArtifactResolver();
    const allAssetArtifact = await publicArtifactResolver.resolve(ctx);

    return new HelloSiteArtifact(
      new URL(import.meta.url),
      allPageArtifact,
      allAssetArtifact,
    );
  }
}
