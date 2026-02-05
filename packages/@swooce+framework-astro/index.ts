import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname as osPathDirname, sep as osPathSep } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { Window, type Document } from "happy-dom";
import { Artifact, type PipelineContext } from "swooce";
import {
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  emitFileArtifactViaCopy,
  type IArtifactWithSrcFileContent,
} from "@swooce/core";

type AstroMarkdownPagesArtifactContent = string;
type AstroModulePagesArtifact = Artifact &
  IArtifactWithSrcFileContent<Document>;
type AstroPublicArtifact = Artifact;

/**
 * Implements {@link IArtifactWithSrcFileContent} with {@link AstroMarkdownPagesArtifactContent}.
 */
class AstroMarkdownPagesArtifact
  extends Artifact
  implements IArtifactWithSrcFileContent<AstroMarkdownPagesArtifactContent>
{
  async fetchSrcFileContent(_ctx: PipelineContext): Promise<string> {
    const srcFileText = await (await fetch(this.srcFileURL)).text();

    return srcFileText;
  }

  constructor(srcFileURL: URL) {
    super(srcFileURL);
  }
}

type AstroArtifact =
  | AstroModulePagesArtifact
  | AstroMarkdownPagesArtifact
  | AstroPublicArtifact;

async function resolveModulePagesArtifact(ctx: AstroPipelineContext) {
  const resolveDynamicGlobArtifact = createDynamicGlobArtifactResolver(
    ctx.projectDirURL,
    "./src/pages/**/*.ts",
  );

  const modulePagesArtiface = (await resolveDynamicGlobArtifact(ctx)) as Array<
    Artifact & IArtifactWithSrcFileContent<Document>
  >;

  return modulePagesArtiface;
}

async function resolveMarkdownPagesArtifact(ctx: AstroPipelineContext) {
  const resolveDynamicGlobArtifact = createFactoryGlobArtifactResolver(
    ctx.projectDirURL,
    "./src/pages/**/*.md",
    (srcFileURL) => new AstroMarkdownPagesArtifact(srcFileURL),
  );

  const markdownPagesArtifact = (await resolveDynamicGlobArtifact(
    ctx,
  )) as Array<
    Artifact & IArtifactWithSrcFileContent<AstroMarkdownPagesArtifactContent>
  >;

  return markdownPagesArtifact;
}

async function resolvePublicArtifact(ctx: AstroPipelineContext) {
  const resolveDynamicGlobArtifact = createFactoryGlobArtifactResolver(
    ctx.projectDirURL,
    "./public/**",
    (srcFileURL) => new Artifact(srcFileURL),
  );

  const publicArtifact = (await resolveDynamicGlobArtifact(ctx)) as Array<
    Artifact & IArtifactWithSrcFileContent<Document>
  >;

  return publicArtifact;
}

async function emitAstroMarkdownPagesArtifact(
  ctx: AstroPipelineContext,
  artifact: AstroArtifact,
): Promise<void> {
  // TODO type guard
  const srcFileContent = await (
    artifact as AstroModulePagesArtifact
  ).fetchSrcFileContent(ctx);

  const window = new Window();
  const document = window.document;
  const documentHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>
        markdown page
      </title>
    </head>
    <body>
      ${srcFileContent}
    </body>
  </html>
  `;
  document.write(documentHTML);

  await window.happyDOM.waitUntilComplete();

  const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${osPathDirname(targetFilePath)}${osPathSep}`;
  const targetFileContent = document.documentElement.outerHTML;

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetFileURL, targetFileContent, "utf-8");
}

async function emitAstroModulePagesArtifact(
  ctx: AstroPipelineContext,
  artifact: AstroArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await (
    artifact as AstroModulePagesArtifact
  ).fetchSrcFileContent(ctx);

  // TODO transform

  const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${osPathDirname(targetFilePath)}${osPathSep}`;
  const targetFileContent = srcContent.documentElement.outerHTML;

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetFileURL, targetFileContent, "utf-8");
}

interface AstroPipelineContext extends PipelineContext<AstroArtifact> {}

function createAstroPipelineContext(packageJsonURL: URL): AstroPipelineContext {
  const projectDirURL = new URL(`${osPathDirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./dist/", projectDirURL);

  return {
    getArtifactRoute: function (
      ctx: AstroPipelineContext,
      artifactSrcFileURL: URL,
    ): string {
      // get relative path of artifact wrt to project dir
      const artifactSrcFileRelativeURLPath = `/${posixRelative(
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
    getArtifactTargetFileURL: function (
      ctx: AstroPipelineContext,
      artifact: Artifact,
    ): URL {
      const artifactRoute = this.getArtifactRoute(ctx, artifact.srcFileURL);

      return new URL(`.${artifactRoute}`, `${ctx.targetDirURL}`);
    },
    getArtifactEmitter(ctx, artifact) {
      const artifactRoute = ctx.getArtifactRoute(ctx, artifact.srcFileURL);

      if (artifactRoute.endsWith(".ts.html")) {
        return emitAstroModulePagesArtifact;
      }

      if (artifactRoute.endsWith(".md.html")) {
        return emitAstroMarkdownPagesArtifact;
      }

      // fallback to copy
      return emitFileArtifactViaCopy;
    },
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  };
}

async function runAstroPipeline(ctx: AstroPipelineContext) {
  await rm(ctx.targetDirURL, { recursive: true, force: true });
  await mkdir(ctx.targetDirURL, { recursive: true });

  const modulePagesArtifact = await resolveModulePagesArtifact(ctx);
  const markdownPagesArtifact = await resolveMarkdownPagesArtifact(ctx);
  const publicArtifact = await resolvePublicArtifact(ctx);

  const siteArtifact = [
    ...modulePagesArtifact,
    ...markdownPagesArtifact,
    ...publicArtifact,
  ];

  for (const iArtifact of siteArtifact) {
    const emitArtifact = ctx.getArtifactEmitter(ctx, iArtifact);
    await emitArtifact(ctx, iArtifact);
  }
}

export {
  createAstroPipelineContext,
  runAstroPipeline,
  type AstroPipelineContext,
};
