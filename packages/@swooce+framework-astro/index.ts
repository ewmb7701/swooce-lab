import { Readable } from "node:stream";
import { dirname as osPathDirname } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { createReadStream } from "node:fs";
import { fileURLToPath } from "node:url";
import { lookup as getMimeType } from "mime-types";
import { Window } from "happy-dom";
import {
  type ArtifactRoute,
  type IArtifactProducer,
  type ISite,
  type ISiteContext,
} from "swooce";
import {
  ArtifactWithSrcFile,
  produceGlobViaImport,
  scanGlobViaFactory,
  writeViaPipeline,
} from "@swooce/core";

class MarkdownPageArtifact extends ArtifactWithSrcFile {
  constructor(route: ArtifactRoute, srcFileURL: URL) {
    super(route, "text/markdown", srcFileURL);
  }
}

async function readMarkdownPage(
  _siteContext: ISiteContext,
  artifact: MarkdownPageArtifact,
) {
  const srcFileText = await (await fetch(artifact.srcFileURL)).text();

  // create document content
  const window = new Window();
  const document = window.document;
  const documentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Post
    </title>
  </head>
  <body>
    <pre>
      ${srcFileText}
    </pre>
  </body>
</html>
`;
  document.write(documentHTML);

  await window.happyDOM.waitUntilComplete();

  return Readable.from(documentHTML);
}

async function scanMarkdownPage(siteContext: ISiteContext) {
  return scanGlobViaFactory(
    "./src/pages/**/*.md",
    siteContext.projectDirURL,
    (srcFileURL) => {
      const route = `/${posixRelative(`${siteContext.projectDirURL.href}/src/pages/`, srcFileURL.href)}.html`;

      return new MarkdownPageArtifact(route, srcFileURL);
    },
  );
}

const produceMarkdownPage = {
  scan: scanMarkdownPage,
  read: readMarkdownPage,
  write: writeViaPipeline,
} satisfies IArtifactProducer;

class PublicArtifact extends ArtifactWithSrcFile {}

async function scanPublicArtifact(siteContext: ISiteContext) {
  return scanGlobViaFactory(
    "./public/**/*",
    siteContext.projectDirURL,
    (srcFileURL) => {
      const srcFilePath = fileURLToPath(srcFileURL);
      const route = `/${posixRelative(`${siteContext.projectDirURL.href}/public/`, srcFileURL.href)}`;
      const mimeType = getMimeType(srcFilePath) || null;

      return new PublicArtifact(route, mimeType, srcFileURL);
    },
  );
}

async function readPublicArtifact(
  _siteContext: ISiteContext,
  artifact: PublicArtifact,
): Promise<Readable> {
  const readable = createReadStream(artifact.srcFileURL);

  return readable;
}

const producePublicArtifact = {
  scan: scanPublicArtifact,
  read: readPublicArtifact,
  write: writeViaPipeline,
} satisfies IArtifactProducer;

interface AstroSiteContext extends ISiteContext {}

function createSiteContext(packageJsonURL: URL): AstroSiteContext {
  const projectDirURL = new URL(`${osPathDirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./dist/", projectDirURL);

  return {
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  };
}

async function createSite(siteContext: ISiteContext): Promise<ISite> {
  const pageArtifactProducer = await produceGlobViaImport(
    "./src/pages/**/*.ts",
    siteContext.projectDirURL,
  );
  const artifactProducers = [
    ...pageArtifactProducer,
    produceMarkdownPage,
    producePublicArtifact,
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
