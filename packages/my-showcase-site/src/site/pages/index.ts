import { Document, Window } from "happy-dom";
import { type PipelineContext } from "swooce";
import { SrcFileArtifact, type IArtifactWithSrcContent } from "@swooce/core";

class IndexPageArtifact
  extends SrcFileArtifact
  implements IArtifactWithSrcContent<Document>
{
  async fetchSrcContent(_ctx: PipelineContext) {
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

export default function resolve(ctx: PipelineContext) {
  const srcFileURL = new URL(import.meta.url);
  const route = ctx.getArtifactRouteUsingSrcFileURL(srcFileURL);

  return Promise.resolve(new IndexPageArtifact(route, srcFileURL));
}
