import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname as osPathDirname, sep as osPathSep } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { Document, Window } from "happy-dom";
import { type Route, type IArtifact, type PipelineContext } from "swooce";
import {
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  emitArtifactSrcFileViaCopy,
  SrcFileArtifact,
  type IArtifactWithSrcContent,
  type IArtifactWithSrcFile,
} from "@swooce/core";

type AstroModulePagesArtifact = SrcFileArtifact &
  IArtifactWithSrcContent<Document>;

type AstroMarkdownPagesArtifactContent = string;

class AstroMarkdownPagesArtifact
  extends SrcFileArtifact
  implements
    IArtifact,
    IArtifactWithSrcFile,
    IArtifactWithSrcContent<AstroMarkdownPagesArtifactContent>
{
  async fetchSrcContent(_ctx: AstroPipelineContext): Promise<string> {
    const srcFileText = await (await fetch(this.srcFileURL)).text();
    return srcFileText;
  }

  constructor(route: Route, srcFileURL: URL) {
    super(route, srcFileURL);
  }
}

class AstroPublicArtifact extends SrcFileArtifact {}

type AstroArtifact =
  | AstroModulePagesArtifact
  | AstroMarkdownPagesArtifact
  | AstroPublicArtifact;

const resolveModulePagesArtifact =
  createDynamicGlobArtifactResolver<AstroModulePagesArtifact>(
    "./src/pages/**/*.ts",
    (ctx) => ctx.projectDirURL,
  );

const resolveMarkdownPagesArtifact =
  createFactoryGlobArtifactResolver<AstroMarkdownPagesArtifact>(
    "./src/pages/**/*.md",
    (ctx) => ctx.projectDirURL,
    (ctx, srcFileURL) =>
      new AstroMarkdownPagesArtifact(
        ctx.getArtifactRouteUsingSrcFileURL(srcFileURL),
        srcFileURL,
      ),
  );

async function resolvePublicArtifact(ctx: AstroPipelineContext) {
  const resolveDynamicGlobArtifact =
    createFactoryGlobArtifactResolver<AstroPublicArtifact>(
      "./public/**",
      (ctx) => ctx.projectDirURL,
      (ctx, srcFileURL) =>
        new SrcFileArtifact(
          ctx.getArtifactRouteUsingSrcFileURL(srcFileURL),
          srcFileURL,
        ),
    );

  const publicArtifact = await resolveDynamicGlobArtifact(ctx);

  return publicArtifact;
}

async function emitAstroModulePagesArtifact(
  ctx: AstroPipelineContext,
  artifact: AstroModulePagesArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await artifact.fetchSrcContent(ctx);

  // TODO transform

  const targetFileURL = ctx.getArtifactTargetFileURL(artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetFileDir = `${osPathDirname(targetFilePath)}${osPathSep}`;
  const targetFileContent = srcContent.documentElement.outerHTML;

  await mkdir(targetFileDir, { recursive: true });
  await writeFile(targetFileURL, targetFileContent, "utf-8");
}

async function emitAstroMarkdownPagesArtifact(
  ctx: AstroPipelineContext,
  artifact: AstroArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await (
    artifact as AstroModulePagesArtifact
  ).fetchSrcContent(ctx);

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
      ${srcContent}
    </body>
  </html>
  `;
  document.write(documentHTML);

  await window.happyDOM.waitUntilComplete();

  const targetFileURL = ctx.getArtifactTargetFileURL(artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${osPathDirname(targetFilePath)}${osPathSep}`;
  const targetContent = document.documentElement.outerHTML;

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetFileURL, targetContent, "utf-8");
}

interface AstroPipelineContext extends PipelineContext {}

function createAstroPipelineContext(packageJsonURL: URL): AstroPipelineContext {
  const projectDirURL = new URL(`${osPathDirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./dist/", projectDirURL);

  return {
    getArtifactRouteUsingSrcFileURL: function (
      artifactSrcFileURL: URL,
    ): string {
      // get relative path of artifact wrt to project dir
      const artifactSrcFileRelativeURLPath = `/${posixRelative(
        this.projectDirURL.href,
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
    getArtifactTargetFileURL: function (artifact): URL {
      const artifactRoute = artifact.route;

      return new URL(`.${artifactRoute}`, `${this.targetDirURL}`);
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
  for (const iModulePageArtifact of modulePagesArtifact) {
    emitAstroModulePagesArtifact(ctx, iModulePageArtifact);
  }

  const markdownPagesArtifact = await resolveMarkdownPagesArtifact(ctx);
  for (const iMarkdownPageArtifact of markdownPagesArtifact) {
    emitAstroMarkdownPagesArtifact(ctx, iMarkdownPageArtifact);
  }

  const publicArtifact = await resolvePublicArtifact(ctx);
  for (const iPublicArtifact of publicArtifact) {
    emitArtifactSrcFileViaCopy(ctx, iPublicArtifact as AstroPublicArtifact);
  }
}

export {
  createAstroPipelineContext,
  runAstroPipeline,
  type AstroPipelineContext,
};
