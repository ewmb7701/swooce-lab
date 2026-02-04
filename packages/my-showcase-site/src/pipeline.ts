import { mkdir, rm, writeFile } from "fs/promises";
import { dirname, sep } from "path";
import { relative as posixRelative } from "path/posix";
import { fileURLToPath } from "url";
import type { Document } from "happy-dom";
import {
  Artifact,
  ArtifactResolver,
  Pipeline,
  type PipelineContext,
} from "swooce";
import {
  ContentArtifactEmitter,
  CopyFileArtifactEmitter,
  DyamicGlobArtifactResolver,
  FactoryGlobArtifactResolver,
  type IArtifactWithSrcFileContent,
} from "@swooce/core";

class ShowcaseModulePagesArtifactResolver extends ArtifactResolver<
  Artifact & IArtifactWithSrcFileContent<Document>
> {
  override async resolve(ctx: PipelineContext) {
    const ModulePagesArtifactResolver = DyamicGlobArtifactResolver(
      ctx.projectDirURL,
      "./src/site/pages/**/*.ts",
    );

    const modulePagesArtifactResolver = new ModulePagesArtifactResolver();
    const allModulePagesArtifact = (await modulePagesArtifactResolver.resolve(
      ctx,
    )) as Array<Artifact & IArtifactWithSrcFileContent<Document>>;

    return allModulePagesArtifact;
  }
}

class ShowcaseStaticArtifactResolver extends ArtifactResolver<Artifact> {
  override async resolve(ctx: PipelineContext) {
    const StaticArtifactResolver = FactoryGlobArtifactResolver(
      ctx.projectDirURL,
      "./src/site/static/**",
      (srcFileURL) => new Artifact(srcFileURL),
    );

    const publicArtifactResolver = new StaticArtifactResolver();
    const allPublicArtifact = await publicArtifactResolver.resolve(ctx);

    return allPublicArtifact;
  }
}

/**
 * {@link ContentArtifactEmitter} for {@link Document} to {@link Document} with standard transform.
 */
class ShowcaseDocumentArtifactEmitter extends ContentArtifactEmitter<
  Artifact & IArtifactWithSrcFileContent<Document>
> {
  override transform(
    _ctx: PipelineContext,
    _artifact: Artifact & IArtifactWithSrcFileContent<Document>,
    srcContent: Document,
  ): Promise<Document> {
    return Promise.resolve(srcContent);
  }

  protected async writeTargetFileContent(
    ctx: PipelineContext,
    artifact: Artifact,
    content: Document,
  ) {
    const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
    const targetFilePath = fileURLToPath(targetFileURL);
    const targetDir = `${dirname(targetFilePath)}${sep}`;

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetFileURL, content.documentElement.outerHTML, "utf-8");
  }

  constructor() {
    super();
  }
}

interface ShowcasePipelineContext extends PipelineContext {}

function createShowcasePipelineContext(
  packageJsonURL: URL,
): ShowcasePipelineContext {
  const projectDirURL = new URL(`${dirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./target/", projectDirURL);

  return {
    getArtifactRoute: function (
      ctx: PipelineContext,
      artifactSrcFileURL: URL,
    ): string {
      // get relative path of artifact wrt to project dir
      const artifactSrcFileRelativeURLPath = `/${posixRelative(
        ctx.projectDirURL.href,
        artifactSrcFileURL.href,
      )}`;

      if (artifactSrcFileRelativeURLPath.startsWith("/src/site/pages/")) {
        return `${artifactSrcFileRelativeURLPath.slice(`/src/site/pages/`.length - 1)}.html`;
      } else if (
        artifactSrcFileRelativeURLPath.startsWith("/src/site/static/")
      ) {
        return artifactSrcFileRelativeURLPath.slice(
          "/src/site/static/".length - 1,
        );
      } else {
        throw new Error(
          `Not supported! artifactSrcFileURL=${artifactSrcFileURL} artifactSrcFileRelativeURLPath=${artifactSrcFileRelativeURLPath}`,
        );
      }
    },
    getArtifactTargetFileURL: function (
      ctx: PipelineContext,
      artifact: Artifact,
    ): URL {
      const artifactRoute = this.getArtifactRoute(ctx, artifact.srcFileURL);

      return new URL(`.${artifactRoute}`, `${ctx.targetDirURL}`);
    },
    getArtifactEmitter(ctx, artifact) {
      const artifactRoute = ctx.getArtifactRoute(ctx, artifact.srcFileURL);

      if (artifactRoute.endsWith(".ts.html")) {
        return new ShowcaseDocumentArtifactEmitter();
      }

      // fallback to copy
      return new CopyFileArtifactEmitter();
    },
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  } satisfies PipelineContext;
}

class ShowcasePipeline extends Pipeline<ShowcasePipelineContext> {
  override async run(ctx: ShowcasePipelineContext): Promise<void> {
    await rm(ctx.targetDirURL, { recursive: true, force: true });
    await mkdir(ctx.targetDirURL, { recursive: true });

    const pageArtifactResolver = new ShowcaseModulePagesArtifactResolver();
    const pageArtifact = await pageArtifactResolver.resolve(ctx);

    const staticArtifactResolver = new ShowcaseStaticArtifactResolver();
    const staticArtifact = await staticArtifactResolver.resolve(ctx);

    const siteArtifact = [...pageArtifact, ...staticArtifact];

    // emit module pages artifacts
    for (const iArtifact of siteArtifact) {
      const iArtifactEmitter = ctx.getArtifactEmitter(ctx, iArtifact);
      await iArtifactEmitter.emit(ctx, iArtifact);
    }
  }
}

export {
  createShowcasePipelineContext,
  ShowcasePipeline,
  type ShowcasePipelineContext,
};
