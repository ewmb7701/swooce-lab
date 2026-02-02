import { Document, Window } from "happy-dom";
import { glob } from "glob";
import { ContentModule, ModuleResolver, type API } from "#swooce";

class PostPageModule extends ContentModule<Document> {
  override async fetch(_api: API): Promise<Document> {
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

export default class extends ModuleResolver<PostPageModule> {
  override async resolve(_api: API) {
    // fetch documents
    const allPostPageSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    const allPostPageModule = allPostPageSrcFileRelativePath.map(
      (iPostPageSrcFileRelativePath) => {
        const iPostPageSrcFileUrl = new URL(
          import.meta.resolve(iPostPageSrcFileRelativePath),
        );

        return new PostPageModule(iPostPageSrcFileUrl);
      },
    );

    return Promise.resolve(allPostPageModule);
  }
}
