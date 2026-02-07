import { Document, Window } from "happy-dom";
import { type ISiteContext } from "swooce";
import { SrcFileArtifact, type IArtifactWithSrcContent } from "@swooce/core";

class IndexPageModuleArtifact
  extends SrcFileArtifact
  implements IArtifactWithSrcContent<Document>
{
  async fetchSrcContent(_siteContext: ISiteContext) {
    const window = new Window();
    const document = window.document;
    const documentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      My Astro Site - Index
    </title>
  </head>
  <body>
    <h1>My Astro Site - Index</h1>
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

export default function resolve(siteContext: ISiteContext) {
  const artifactSrcFileURL = new URL(import.meta.url);
  const artifactRoute = siteContext.getArtifactRouteUsingSrcFileURL(
    new URL(import.meta.url),
  );
  const artifactMimeType = "text/html";

  return Promise.resolve(
    new IndexPageModuleArtifact(
      artifactRoute,
      artifactMimeType,
      artifactSrcFileURL,
    ),
  );
}
