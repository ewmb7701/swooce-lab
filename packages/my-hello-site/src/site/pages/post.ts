import { Document, Window } from "happy-dom";
import { type PipelineContext } from "swooce";
import { ContentArtifact, FactoryGlobArtifactResolver } from "@swooce/core";

class PostPageArtifact extends ContentArtifact<Document> {
  override async fetch(_ctx: PipelineContext): Promise<Document> {
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
  import.meta.url,
  "./post/*.md",
  (url) => new PostPageArtifact(url),
);
