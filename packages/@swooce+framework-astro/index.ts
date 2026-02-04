import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname as osDirname, sep as osSep } from "node:path";
import { relative, dirname } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { Window, type Document } from "happy-dom";
import {
  Artifact,
  Pipeline,
  ArtifactResolver,
  type PipelineContext,
} from "swooce";
import {
  ContentArtifactEmitter,
  CopyFileArtifactEmitter,
  DyamicGlobArtifactResolver,
  FactoryGlobArtifactResolver,
  type IArtifactWithSrcFileContent,
} from "@swooce/core";

type AstroMarkdownDocumentContent = string;

/**
 * Implements {@link IArtifactWithSrcFileContent} with {@link AstroMarkdownDocumentContent}.
 */
class AstroMarkdownDocumentSrcContentArtifact
  extends Artifact
  implements IArtifactWithSrcFileContent<AstroMarkdownDocumentContent>
{
  async fetchSrcFileContent(_ctx: PipelineContext): Promise<string> {
    const srcFileText = await (await fetch(this.srcFileURL)).text();

    return srcFileText;
  }

  constructor(srcFileURL: URL) {
    super(srcFileURL);
  }
}

class AstroModulePagesArtifactResolver extends ArtifactResolver<
  Artifact & IArtifactWithSrcFileContent<Document>
> {
  override async resolve(ctx: PipelineContext) {
    const ModulePagesArtifactResolver = DyamicGlobArtifactResolver(
      ctx.projectDirURL,
      "./src/pages/**/*.ts",
    );

    const modulePagesArtifactResolver = new ModulePagesArtifactResolver();
    const allModulePagesArtifact = (await modulePagesArtifactResolver.resolve(
      ctx,
    )) as Array<Artifact & IArtifactWithSrcFileContent<Document>>;

    return allModulePagesArtifact;
  }
}

class AstroMarkdownPagesArtifactResolver extends ArtifactResolver<
  Artifact & IArtifactWithSrcFileContent<string>
> {
  override async resolve(ctx: PipelineContext) {
    const MarkdownPagesArtifactResolver = FactoryGlobArtifactResolver(
      ctx.projectDirURL,
      "./src/pages/**/*.md",
      (artifactSrcFileURL) =>
        new AstroMarkdownDocumentSrcContentArtifact(artifactSrcFileURL),
    );

    const markdownPagesArtifactResolver = new MarkdownPagesArtifactResolver();
    const allMarkdownPagesArtifact =
      (await markdownPagesArtifactResolver.resolve(ctx)) as Array<
        Artifact & IArtifactWithSrcFileContent<AstroMarkdownDocumentContent>
      >;

    return allMarkdownPagesArtifact;
  }
}

class AstroPublicArtifactResolver extends ArtifactResolver<Artifact> {
  override async resolve(ctx: PipelineContext) {
    const PublicArtifactResolver = FactoryGlobArtifactResolver(
      ctx.projectDirURL,
      "./public/**",
      (srcFileURL) => new Artifact(srcFileURL),
    );

    const publicArtifactResolver = new PublicArtifactResolver();
    const allPublicArtifact = await publicArtifactResolver.resolve(ctx);

    return allPublicArtifact;
  }
}

/**
 * {@link ContentArtifactEmitter} for {@link Document} to {@link Document} with standard transform.
 */
class AstroDocumentArtifactEmitter extends ContentArtifactEmitter<
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
    const targetDir = `${osDirname(targetFilePath)}${osSep}`;

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetFileURL, content.documentElement.outerHTML, "utf-8");
  }

  constructor() {
    super();
  }
}

/**
 * {@link ContentArtifactEmitter} for {@link Document} to {@link Document} with standard transform.
 */
class AstroMarkdownDocumentArtifactEmitter extends ContentArtifactEmitter<
  Artifact & IArtifactWithSrcFileContent<AstroMarkdownDocumentContent>,
  AstroMarkdownDocumentContent,
  Document
> {
  // TODO https://github.com/withastro/blog-tutorial-demo/blob/complete/src/layouts/MarkdownPostLayout.astro

  override async transform(
    _ctx: PipelineContext,
    _artifact: Artifact &
      IArtifactWithSrcFileContent<AstroMarkdownDocumentContent>,
    srcFileContent: AstroMarkdownDocumentContent,
  ): Promise<Document> {
    const window = new Window();
    const document = window.document;
    const documentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Index
    </title>
  </head>
  <body>
    <h1>Index</h1>
    ${srcFileContent}
  </body>
</html>
`;
    document.write(documentHTML);

    await window.happyDOM.waitUntilComplete();

    return document;
  }

  protected async writeTargetFileContent(
    ctx: PipelineContext,
    artifact: Artifact,
    content: Document,
  ) {
    const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
    const targetFilePath = fileURLToPath(targetFileURL);
    const targetDir = `${osDirname(targetFilePath)}${osSep}`;

    await mkdir(targetDir, { recursive: true });
    await writeFile(targetFileURL, content.documentElement.outerHTML, "utf-8");
  }

  constructor() {
    super();
  }
}

interface AstroPipelineContext extends PipelineContext {}

function createAstroPipelineContext(packageJsonURL: URL): AstroPipelineContext {
  const projectDirURL = new URL(`${dirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./dist/", projectDirURL);

  return {
    /**
     * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `/posts/post-1.md.html`.
     */
    getArtifactRoute: function (
      ctx: PipelineContext,
      artifactSrcFileURL: URL,
    ): string {
      // get relative path of artifact wrt to project dir
      const artifactSrcFileRelativeURLPath = `/${relative(
        ctx.projectDirURL.href,
        artifactSrcFileURL.href,
      )}`;

      if (artifactSrcFileRelativeURLPath.startsWith("/src/pages/")) {
        return `${artifactSrcFileRelativeURLPath.slice(`/src/pages/`.length - 1)}.html`;
      } else if (artifactSrcFileRelativeURLPath.startsWith("/public/")) {
        return artifactSrcFileRelativeURLPath.slice("/public/".length - 1);
      } else {
        throw new Error(
          `Not supported! artifactSrcFileURL=${artifactSrcFileURL} artifactSrcFileRelativeURLPath=${artifactSrcFileRelativeURLPath}`,
        );
      }
    },
    /**
     * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/pages/posts/post-1.md`.
     */
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
        return new AstroDocumentArtifactEmitter();
      }

      if (artifactRoute.endsWith(".md.html")) {
        return new AstroMarkdownDocumentArtifactEmitter();
      }

      // fallback to copy
      return new CopyFileArtifactEmitter();
    },
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  } satisfies PipelineContext;
}

class AstroPipeline extends Pipeline<AstroPipelineContext> {
  override async run(ctx: AstroPipelineContext): Promise<void> {
    await rm(ctx.targetDirURL, { recursive: true, force: true });
    await mkdir(ctx.targetDirURL, { recursive: true });

    const modulePagesArtifactResolver = new AstroModulePagesArtifactResolver();
    const modulePagesArtifact = await modulePagesArtifactResolver.resolve(ctx);

    const markdownPagesArtifactResolver =
      new AstroMarkdownPagesArtifactResolver();
    const markdownPagesArtifact =
      await markdownPagesArtifactResolver.resolve(ctx);

    const publicArtifactResolver = new AstroPublicArtifactResolver();
    const publicArtifact = await publicArtifactResolver.resolve(ctx);

    const allArtifact = [
      ...modulePagesArtifact,
      ...markdownPagesArtifact,
      ...publicArtifact,
    ];

    // emit module pages artifacts
    for (const iArtifact of allArtifact) {
      const iArtifactEmitter = ctx.getArtifactEmitter(ctx, iArtifact);
      await iArtifactEmitter.emit(ctx, iArtifact);
    }
  }
}

export {
  createAstroPipelineContext,
  AstroPipeline,
  AstroMarkdownDocumentSrcContentArtifact,
  type AstroPipelineContext,
};
