import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname as osPathDirname, sep as osPathSep } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { Document, Window } from "happy-dom";
import {
  type ArtifactRoute,
  type IArtifact,
  type IArtifactProducer,
  type ISite,
  type ISiteContext,
} from "swooce";
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
  async fetchSrcContent(_siteContext: AstroSiteContext): Promise<string> {
    const srcFileText = await (await fetch(this.srcFileURL)).text();
    return srcFileText;
  }

  constructor(route: ArtifactRoute, srcFileURL: URL) {
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
    (siteContext) => siteContext.projectDirURL,
  );

const resolveMarkdownPagesArtifact =
  createFactoryGlobArtifactResolver<AstroMarkdownPagesArtifact>(
    "./src/pages/**/*.md",
    (siteContext) => siteContext.projectDirURL,
    (siteContext, srcFileURL) =>
      new AstroMarkdownPagesArtifact(
        siteContext.getArtifactRouteUsingSrcFileURL(srcFileURL),
        srcFileURL,
      ),
  );

async function resolvePublicArtifact(siteContext: AstroSiteContext) {
  const resolveDynamicGlobArtifact =
    createFactoryGlobArtifactResolver<AstroPublicArtifact>(
      "./public/**",
      (siteContext) => siteContext.projectDirURL,
      (siteContext, srcFileURL) =>
        new SrcFileArtifact(
          siteContext.getArtifactRouteUsingSrcFileURL(srcFileURL),
          srcFileURL,
        ),
    );

  const publicArtifact = await resolveDynamicGlobArtifact(siteContext);

  return publicArtifact;
}

async function emitAstroModulePagesArtifact(
  siteContext: AstroSiteContext,
  artifact: AstroModulePagesArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await artifact.fetchSrcContent(siteContext);

  // TODO transform

  const targetFileURL = siteContext.getArtifactTargetFileURL(artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetFileDir = `${osPathDirname(targetFilePath)}${osPathSep}`;
  const targetFileContent = srcContent.documentElement.outerHTML;

  await mkdir(targetFileDir, { recursive: true });
  await writeFile(targetFileURL, targetFileContent, "utf-8");
}

async function emitAstroMarkdownPagesArtifact(
  siteContext: AstroSiteContext,
  artifact: AstroArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await (
    artifact as AstroModulePagesArtifact
  ).fetchSrcContent(siteContext);

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

  const targetFileURL = siteContext.getArtifactTargetFileURL(artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${osPathDirname(targetFilePath)}${osPathSep}`;
  const targetContent = document.documentElement.outerHTML;

  await mkdir(targetDir, { recursive: true });
  await writeFile(targetFileURL, targetContent, "utf-8");
}

interface AstroSiteContext extends ISiteContext {}

function createSiteContext(packageJsonURL: URL): AstroSiteContext {
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

function createSite(): ISite {
  const artifactProducers = [
    {
      resolve: resolveModulePagesArtifact,
      emit: emitAstroMarkdownPagesArtifact,
    },
    {
      resolve: resolveMarkdownPagesArtifact,
      emit: emitAstroMarkdownPagesArtifact,
    },
    {
      resolve: resolvePublicArtifact,
      emit: emitArtifactSrcFileViaCopy,
    },
  ];

  return {
    artifactProducer: artifactProducers,
  };
}

export {
  createSiteContext,
  createSite,
  createSite as default,
  type AstroSiteContext,
};
