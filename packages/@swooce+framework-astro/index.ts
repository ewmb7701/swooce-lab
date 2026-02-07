import { Writable } from "node:stream";
import { dirname as osPathDirname } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { lookup as getMimeType } from "mime-types";
import { Document, Window } from "happy-dom";
import {
  type ArtifactRoute,
  type IArtifact,
  type ISite,
  type ISiteContext,
} from "swooce";
import {
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  writeArtifactViaCopy,
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
    super(route, "text/html", srcFileURL);
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
      (siteContext, srcFileURL) => {
        const srcFilePath = srcFileURL.href;
        const route = siteContext.getArtifactRouteUsingSrcFileURL(srcFileURL);
        const mimeType = getMimeType(srcFilePath) || null;

        const artifact = new SrcFileArtifact(route, mimeType, srcFileURL);

        return artifact;
      },
    );

  const publicArtifact = await resolveDynamicGlobArtifact(siteContext);

  return publicArtifact;
}

async function writeAstroModulePagesArtifact(
  siteContext: AstroSiteContext,
  artifact: AstroModulePagesArtifact,
  artifactTargetWritable: Writable,
): Promise<void> {
  const srcContent = await artifact.fetchSrcContent(siteContext);
  // TODO transform
  const targetContent = srcContent.documentElement.outerHTML;
  artifactTargetWritable.write(targetContent);
}

async function writeAstroMarkdownPagesArtifact(
  siteContext: AstroSiteContext,
  artifact: AstroArtifact,
  artifactTargetWritable: Writable,
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

  artifactTargetWritable.write(documentHTML);
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
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  };
}

function createSite(): ISite {
  const artifactProducers = [
    {
      resolve: resolveModulePagesArtifact,
      write: writeAstroModulePagesArtifact,
    },
    {
      resolve: resolveMarkdownPagesArtifact,
      write: writeAstroMarkdownPagesArtifact,
    },
    {
      resolve: resolvePublicArtifact,
      write: writeArtifactViaCopy,
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
