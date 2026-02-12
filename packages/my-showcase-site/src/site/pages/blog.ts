import { Window } from "happy-dom";
import { relative as posixRelative } from "node:path/posix";
import { Readable } from "node:stream";
import { glob } from "glob";
import {
  type ArtifactRoute,
  type IArtifactProducer,
  type ISiteContext,
} from "swooce";
import { ArtifactWithSrcFile, writeViaPipeline } from "@swooce/core";

class BlogPageArtifact extends ArtifactWithSrcFile {
  readonly allPostPageArtifactSrcRelativeURL: URL[];

  constructor(
    route: ArtifactRoute,
    srcFileURL: URL,
    allPostPageArtifactSrcURL: URL[],
  ) {
    super(route, "text/html", srcFileURL);
    this.allPostPageArtifactSrcRelativeURL = allPostPageArtifactSrcURL;
  }
}

async function scan(siteContext: ISiteContext) {
  const allPostArtifactSrcFileRelativePath = await glob(`./post/*.md`, {
    cwd: import.meta.dir,
    posix: true,
    dotRelative: true,
  });
  const allPostArtifactSrcFileRelativeURL =
    allPostArtifactSrcFileRelativePath.map((iPostPageSrcFileRelativePath) => {
      return new URL(import.meta.resolve(iPostPageSrcFileRelativePath));
    });
  // TODO actualize post artifact routes here

  const srcFileURL = new URL(import.meta.url);
  const route = `/${posixRelative(`${siteContext.projectDirURL.href}/src/site/pages/`, srcFileURL.href)}.html`;
  const artifact = new BlogPageArtifact(
    route,
    srcFileURL,
    allPostArtifactSrcFileRelativeURL,
  );

  return Promise.resolve([artifact]);
}

async function read(
  _siteContext: ISiteContext,
  artifact: BlogPageArtifact,
): Promise<Readable> {
  const window = new Window();
  const document = window.document;

  const documentContentAllPostPageHTMLListItems =
    artifact.allPostPageArtifactSrcRelativeURL.map(
      (iArtifactSrcRelativeFileURL) => {
        return `<li><a href="${iArtifactSrcRelativeFileURL}">${iArtifactSrcRelativeFileURL}</a></li>`;
      },
    );
  const documentHTML = `
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
  document.write(documentHTML);

  await window.happyDOM.waitUntilComplete();

  const outDocumentHTML = document.documentElement.outerHTML;

  return Readable.from(outDocumentHTML);
}

const producer = {
  scan,
  read,
  write: writeViaPipeline,
} satisfies IArtifactProducer;

export { scan, read, producer, producer as default };
