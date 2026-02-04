import { Document, Window } from "happy-dom";
import { Artifact, type PipelineContext } from "swooce";
import {
  FactoryGlobArtifactResolver,
  type IArtifactWithSrcFileContent,
} from "@swooce/core";
import { pathToFileURL } from "node:url";
import { sep } from "node:path";

class PostPageArtifact
  extends Artifact
  implements IArtifactWithSrcFileContent<Document>
{
  async fetchSrcFileContent(_ctx: PipelineContext): Promise<Document> {
    const srcFileText = await (await fetch(this.srcFileURL)).text();

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

    return document;
  }

  constructor(srcFileURL: URL) {
    super(srcFileURL);
  }
}

export default FactoryGlobArtifactResolver(
  pathToFileURL(`${import.meta.dir}${sep}`),
  "./post/*.md",
  (url) => new PostPageArtifact(url),
);
