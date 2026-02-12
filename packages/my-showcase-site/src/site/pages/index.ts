import { Readable } from "node:stream";
import { relative as posixRelative } from "node:path/posix";
import { Window } from "happy-dom";
import { type IArtifactProducer, type ISiteContext } from "swooce";
import { ArtifactWithSrcFile, writeViaPipeline } from "@swooce/core";

function getRandomIntInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; // The maximum is inclusive and the minimum is inclusive
}

class IndexPageArtifact extends ArtifactWithSrcFile {}

async function scan(siteContext: ISiteContext) {
  const srcFileURL = new URL(import.meta.url);
  const route = `/${posixRelative(`${siteContext.projectDirURL.href}/src/site/pages/`, srcFileURL.href)}.html`;
  const artifact = [new IndexPageArtifact(route, "text/html", srcFileURL)];

  return Promise.resolve(artifact);
}

async function read(
  _siteContext: ISiteContext,
  _artifact: IndexPageArtifact,
): Promise<Readable> {
  const hours = getRandomIntInclusive(1, 12);

  const window = new Window();
  const document = window.document;
  const documentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      My Showcase Site - Index
    </title>
  </head>
  <body>
    <h1>My Showcase Site - Index</h1>
    <img
      src="/clock-drawing.png"
    />
    <img
      src="/clock-drawing.svg"
    />
    <p>So how's about we put ${hours} hours on the clock?</p>
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
