import { glob } from "glob";
import { Window } from "happy-dom";
import { Document, DocumentFactory, type API } from "#swooce";

export default class extends DocumentFactory {
  override async create(_api: API) {
    // fetch inputs
    const allDocumentSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    let allDocumentSrc = [];
    for await (const iDocumentSrcFileRelativePath of allDocumentSrcFileRelativePath) {
      const iDocumentSrcFileURL = new URL(
        import.meta.resolve(iDocumentSrcFileRelativePath),
      );
      const iDocumentSrcContentText = await (
        await fetch(iDocumentSrcFileURL)
      ).text();
      const iDocumentSrcContent = new Window().document;

      // TODO generate proper html with frontmatter (use some markdown parser)
      const iDocumentSrcContentHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>
    ${iDocumentSrcFileRelativePath}
    </title>
  </head>
  <body>
    <pre>
      ${iDocumentSrcContentText}
    </pre>
  </body>
</html>
`;
      iDocumentSrcContent.write(iDocumentSrcContentHtml);

      const iDocumentSrc = new Document(
        iDocumentSrcFileURL,
        iDocumentSrcContent,
      );
      allDocumentSrc.push(iDocumentSrc);
    }

    return Promise.resolve(allDocumentSrc);
  }
}
