import { Window } from "happy-dom";
import { SrcDocument, SrcDocumentFactory, type API } from "#swooce";

export default class extends SrcDocumentFactory {
  override create(_api: API) {
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
    );

    return Promise.resolve(srcDocument);
  }
}
