import { Document, Window } from "happy-dom";
import { ModuleResolver, type Context } from "swooce";
import { ContentModule } from "@swooce/core";

class IndexPageModule extends ContentModule<Document> {
  override async fetch(_ctx: Context) {
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

export default class extends ModuleResolver<IndexPageModule> {
  override resolve(_ctx: Context) {
    return Promise.resolve(new IndexPageModule(new URL(import.meta.url)));
  }
}
