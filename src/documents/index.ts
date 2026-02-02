import { Window } from "happy-dom";
import { Document, DocumentFactory, type API } from "#swooce";

export default class extends DocumentFactory {
  override create(_api: API) {
    const documentContent = new Window().document;
    const documentContentHTML = `
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
    documentContent.write(documentContentHTML);

    const document = new Document(new URL(import.meta.url), documentContent);

    return Promise.resolve(document);
  }
}
