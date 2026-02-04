import { Document, Window } from "happy-dom";
import { Artifact, ArtifactResolver, type PipelineContext } from "swooce";
import type { IArtifactWithSrcFileContent } from "@swooce/core";

class IndexPageModuleArtifact
  extends Artifact
  implements IArtifactWithSrcFileContent<Document>
{
  async fetchSrcFileContent(_ctx: PipelineContext) {
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

export default class extends ArtifactResolver<IndexPageModuleArtifact> {
  override resolve(_ctx: PipelineContext) {
    return Promise.resolve(
      new IndexPageModuleArtifact(new URL(import.meta.url)),
    );
  }
}
