import { pathToFileURL } from "node:url";
import { sep } from "node:path";
import { Document, Window } from "happy-dom";
import { type ISiteContext, type ArtifactRoute } from "swooce";
import {
  createFactoryGlobArtifactResolver,
  SrcFileArtifact,
  type IArtifactWithSrcContent,
} from "@swooce/core";

class PostPageArtifact
  extends SrcFileArtifact
  implements IArtifactWithSrcContent<Document>
{
  async fetchSrcContent(_siteContext: ISiteContext): Promise<Document> {
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

  constructor(route: ArtifactRoute, srcFileURL: URL) {
    super(route, "text/html", srcFileURL);
  }
}

export default createFactoryGlobArtifactResolver(
  "./post/*.md",
  (_siteContext) => pathToFileURL(`${import.meta.dir}${sep}`),
  (siteContext, url) => {
    const artifactRoute = siteContext.getArtifactRouteUsingSrcFileURL(url);
    const artifactSrcFileURL = url;
    return new PostPageArtifact(artifactRoute, artifactSrcFileURL);
  },
);
