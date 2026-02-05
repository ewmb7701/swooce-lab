import { pathToFileURL } from "node:url";
import { sep } from "node:path";
import { Document, Window } from "happy-dom";
import { type PipelineContext, type Route } from "swooce";
import {
  createFactoryGlobArtifactResolver,
  SrcFileArtifact,
  type IArtifactWithSrcContent,
} from "@swooce/core";

class PostPageArtifact
  extends SrcFileArtifact
  implements IArtifactWithSrcContent<Document>
{
  async fetchSrcContent(_ctx: PipelineContext): Promise<Document> {
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

  constructor(route: Route, srcFileURL: URL) {
    super(route, srcFileURL);
  }
}

export default createFactoryGlobArtifactResolver(
  "./post/*.md",
  (_ctx) => pathToFileURL(`${import.meta.dir}${sep}`),
  (ctx, url) => {
    const artifactRoute = ctx.getArtifactRouteUsingSrcFileURL(url);
    const artifactSrcFileURL = url;
    return new PostPageArtifact(artifactRoute, artifactSrcFileURL);
  },
);
