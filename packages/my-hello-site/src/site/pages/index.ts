import { Document, Window } from "happy-dom";
import { ArtifactResolver, type Context } from "swooce";
import { ContentArtifact } from "@swooce/core";

class IndexPageArtifact extends ContentArtifact<Document> {
  override async fetch(_ctx: Context) {
    const window = new Window();
    const document = window.document;
    const documentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Index
    </title>
  </head>
  <body>
    <h1>Index</h1>
    <img
      src="/clock-drawing.png"
    />
    <img
      src="/clock-drawing.svg"
    />
  </body>
</html>
`;
    document.write(documentHTML);

    await window.happyDOM.waitUntilComplete();

    return document;
  }
}

export default class extends ArtifactResolver<IndexPageArtifact> {
  override resolve(_ctx: Context) {
    return Promise.resolve(new IndexPageArtifact(new URL(import.meta.url)));
  }
}
