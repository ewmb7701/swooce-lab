import { Readable } from "node:stream";
import { relative as posixRelative } from "node:path/posix";
import { glob } from "glob";
import { Window } from "happy-dom";
import {
  type ISiteContext,
  type ArtifactRoute,
  type IArtifactProducer,
} from "swooce";
import { ArtifactWithSrcFile, writeViaPipeline } from "@swooce/core";

class BlogPageArtifact extends ArtifactWithSrcFile {
  readonly allPostPageArtifactSrcURL: URL[];

  constructor(
    route: ArtifactRoute,
    srcFileURL: URL,
    allPostPageArtifactSrcURL: URL[],
  ) {
    super(route, "text/html", srcFileURL);
    this.allPostPageArtifactSrcURL = allPostPageArtifactSrcURL;
  }
}

async function read(
  _siteContext: ISiteContext,
  artifact: BlogPageArtifact,
): Promise<Readable> {
  const window = new Window();
  const document = window.document;

  const documentContentAllPostPageHTMLListItems =
    artifact.allPostPageArtifactSrcURL.map((iArtifactSrcRelativeFileURL) => {
      return `<li><a href="${iArtifactSrcRelativeFileURL}">${iArtifactSrcRelativeFileURL}</a></li>`;
    });

  const contentDocumentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Blog
    </title>
  </head>
  <body>
    <p>Hello! This is my blog website. Based on Astro.</p>
    <ul>
      ${documentContentAllPostPageHTMLListItems}
    </ul>
  </body>
</html>
`;
  document.write(contentDocumentHTML);

  await window.happyDOM.waitUntilComplete();

  return Readable.from(contentDocumentHTML);
}

async function scan(siteContext: ISiteContext) {
  // find artifact dependencies
  const allPostArtifactSrcFileRelativePath = await glob(`./post/*.md`, {
    cwd: import.meta.dir,
    posix: true,
    dotRelative: true,
  });

  const allPostArtifactSrcFileRelativeURL =
    allPostArtifactSrcFileRelativePath.map((iPostPageSrcFileRelativePath) => {
      return new URL(import.meta.resolve(iPostPageSrcFileRelativePath));
    });
  const srcFileURL = new URL(import.meta.url);
  const route = `/${posixRelative(`${siteContext.projectDirURL.href}/src/pages/`, srcFileURL.href)}.html`;
  const artifact = new BlogPageArtifact(
    route,
    srcFileURL,
    allPostArtifactSrcFileRelativeURL,
  );

  return Promise.resolve([artifact]);
}

const producer = {
  scan,
  read,
  write: writeViaPipeline,
} satisfies IArtifactProducer;

export { scan, read, producer, producer as default };
