import { relative as posixRelative } from "node:path/posix";
import { Readable } from "node:stream";
import { Window } from "happy-dom";
import {
  type ISiteContext,
  type ArtifactRoute,
  type IArtifactProducer,
} from "swooce";
import {
  ArtifactWithSrcFile,
  scanGlobViaFactory,
  writeViaPipeline,
} from "@swooce/core";

class PostPageArtifact extends ArtifactWithSrcFile {
  constructor(route: ArtifactRoute, srcFileURL: URL) {
    super(route, "text/html", srcFileURL);
  }
}

async function scan(siteContext: ISiteContext) {
  return scanGlobViaFactory(
    "./src/site/pages/post/**/*.md",
    siteContext.projectDirURL,
    (srcFileURL) => {
      const route = `/${posixRelative(`${siteContext.projectDirURL.href}/src/site/pages/`, srcFileURL.href)}.html`;

      return new PostPageArtifact(route, srcFileURL);
    },
  );
}

async function read(_siteContext: ISiteContext, artifact: PostPageArtifact) {
  const srcFileText = await (await fetch(artifact.srcFileURL)).text();

  const window = new Window();
  const document = window.document;
  const documentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      ${artifact.route}
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

  const outDocumentHTML = document.documentElement.outerHTML;

  return Readable.from(outDocumentHTML);
}

const producer = {
  scan,
  read,
  write: writeViaPipeline,
} satisfies IArtifactProducer;

export { scan, read, producer, producer as default };
