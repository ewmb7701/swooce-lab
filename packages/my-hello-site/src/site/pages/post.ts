import { Document, Window } from "happy-dom";
import { type Context } from "swooce";
import { ContentModule, FactoryGlobModuleResolver } from "@swooce/core";

class PostPageModule extends ContentModule<Document> {
  override async fetch(_ctx: Context): Promise<Document> {
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

  constructor(srcFileURL: URL) {
    super(srcFileURL);
  }
}

export default FactoryGlobModuleResolver(
  import.meta.url,
  "./post/*.md",
  (url) => new PostPageModule(url),
);
