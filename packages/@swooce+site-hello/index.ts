/**
 * this source file contains `swooce` items for public site generation like Hello.
 *
 * This is a *lab*.
 *
 * ie, fileystem based routing.
 */

import { relative } from "path/posix";
import type { Document } from "happy-dom";
import { Artifact, ArtifactEmitter, type PipelineContext } from "swooce";
import {
  CopyArtifactEmitter,
  type ContentArtifact,
  type VoidArtifact,
} from "@swooce/core";
import { DocumentContentArtifactEmitter } from "@swooce/happy-dom";

function createHelloSitePipelineContext(projectDirURL: URL): PipelineContext {
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./target/", projectDirURL);

  return {
    paths: {
      /**
       * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `/posts/post-1.md.html`.
       */
      resolveArtifactRoute: function (
        ctx: PipelineContext,
        artifactSrcFileURL: URL,
      ): string {
        const artifactSrcFileRelativeURLPath = `/${relative(
          ctx.paths.srcDirURL.href,
          artifactSrcFileURL.href,
        )}`;

        if (artifactSrcFileRelativeURLPath.startsWith("/site/pages/")) {
          return `${artifactSrcFileRelativeURLPath.slice(`/site/pages/`.length - 1)}.html`;
        } else if (artifactSrcFileRelativeURLPath.startsWith("/site/public/")) {
          return artifactSrcFileRelativeURLPath.slice(
            "/site/public/".length - 1,
          );
        } else {
          throw new Error(
            `Not supported! artifactSrcFileURL=${artifactSrcFileURL} artifactSrcFileRelativeURLPath=${artifactSrcFileRelativeURLPath}`,
          );
        }
      },
      /**
       * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/pages/posts/post-1.md`.
       */
      resolveArtifactTargetFileURL: function (
        ctx: PipelineContext,
        artifact: Artifact,
      ): URL {
        const artifactRoute = this.resolveArtifactRoute(
          ctx,
          artifact.srcFileURL,
        );

        return new URL(`.${artifactRoute}`, `${ctx.paths.targetDirURL}`);
      },
      srcDirURL: srcDirURL,
      targetDirURL: targetDirURL,
    },
  } satisfies PipelineContext;
}

class HelloSiteArtifact extends Artifact {
  /**
   * Artifacts resolves from src/state/pages
   */
  readonly pageArtifact: Array<ContentArtifact<Document>>;
  readonly publicArtifact: Array<VoidArtifact>;

  constructor(
    srcFileURL: URL,
    pageArtifact: Array<ContentArtifact<Document>>,
    publicArtifact: Array<VoidArtifact>,
  ) {
    super(srcFileURL);
    this.pageArtifact = pageArtifact;
    this.publicArtifact = publicArtifact;
  }
}

class HelloSiteEmitter extends ArtifactEmitter<HelloSiteArtifact> {
  /**
   * Emit artifact content to output directory.
   * The emitted files are the final build artifacts.
   */
  async emit(ctx: PipelineContext, site: HelloSiteArtifact): Promise<void> {
    const pageArtifactEmitter = new DocumentContentArtifactEmitter();
    for (const iPageArtifact of site.pageArtifact) {
      pageArtifactEmitter.emit(ctx, iPageArtifact);
    }

    const publicArtifactEmitter = new CopyArtifactEmitter();
    for (const iPublicArtifact of site.publicArtifact) {
      publicArtifactEmitter.emit(ctx, iPublicArtifact);
    }
  }

  constructor() {
    super();
  }
}

export { HelloSiteArtifact, HelloSiteEmitter, createHelloSitePipelineContext };
