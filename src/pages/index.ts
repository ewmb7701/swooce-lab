import { Document, Window } from "happy-dom";
import { ContentModule, ModuleResolver, type API } from "#swooce";

class IndexDocumentModule extends ContentModule<Document> {
  override async fetch(_api: API) {
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
  </body>
</html>
`;
    document.write(documentHTML);

    await window.happyDOM.waitUntilComplete();

    return document;
  }
}

export default class extends ModuleResolver<IndexDocumentModule> {
  override resolve(_api: API) {
    return Promise.resolve(new IndexDocumentModule(new URL(import.meta.url)));
  }
}
