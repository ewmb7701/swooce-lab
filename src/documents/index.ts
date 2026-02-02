import { Window } from "happy-dom";
import { DocumentSrc, DocumentSrcFactory, type API } from "#swooce";

export default class extends DocumentSrcFactory {
  override create(_api: API) {
    const documentSrcContent = new Window().document;
    const documentSrcContentHtml = `
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
    documentSrcContent.write(documentSrcContentHtml);

    const documentSrc = new DocumentSrc(
      new URL(import.meta.url),
      documentSrcContent,
    );

    return Promise.resolve(documentSrc);
  }
}
