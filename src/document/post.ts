import { Window } from "happy-dom";
import { glob } from "glob";
import { Document, DocumentFactory, type API } from "#swooce";

export default class extends DocumentFactory {
  override async create(_api: API) {
    // fetch document inputs
    const allInputPostDocumentSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    let allDocument = [];
    for await (const iInputPostDocumentSrcFileRelativePath of allInputPostDocumentSrcFileRelativePath) {
      const iDocumentSrcFileURL = new URL(
        import.meta.resolve(iInputPostDocumentSrcFileRelativePath),
      );
      const iDocumentSrcContentText = await (
        await fetch(iDocumentSrcFileURL)
      ).text();

      // create document content
      // TODO generate proper html with frontmatter (use some markdown parser)
      const iDocumentContent = new Window().document;
      const iDocumentContentHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>
    ${iInputPostDocumentSrcFileRelativePath}
    </title>
  </head>
  <body>
    <pre>
      ${iDocumentSrcContentText}
    </pre>
  </body>
</html>
`;
      iDocumentContent.write(iDocumentContentHtml);

      const iDocumentSrc = new Document(iDocumentSrcFileURL, iDocumentContent);
      allDocument.push(iDocumentSrc);
    }

    return Promise.resolve(allDocument);
  }
}
