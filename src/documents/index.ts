import { Window } from "happy-dom";
import { SrcDocument, SrcDocumentFactory, type CommonAPI } from "#swooce";

const TARGET_ROUTE_PATH = "/index.html";

export default class extends SrcDocumentFactory {
  override create(_api: CommonAPI) {
    const srcDocumentContent = new Window().document;
    const srcDocumentContentHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Index
    </title>
  </head>
  <body>
    <h1>Index</h1>
  </body>
</html>
`;
    srcDocumentContent.write(srcDocumentContentHtml);

    const srcDocument = new SrcDocument(
      new URL(import.meta.url),
      srcDocumentContent,
      TARGET_ROUTE_PATH,
    );

    return Promise.resolve(srcDocument);
  }
}
