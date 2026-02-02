import { glob } from "glob";
import { Window } from "happy-dom";
import { SrcDocument, SrcDocumentFactory, type API } from "#swooce";

export default class extends SrcDocumentFactory {
  override async create(_api: API) {
    // fetch inputs
    const srcDocumentsFileRelativePaths = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    let srcDocuments = [];
    for await (const srcDocumentFileRelativePath of srcDocumentsFileRelativePaths) {
      const srcDocumentFileURL = new URL(
        import.meta.resolve(srcDocumentFileRelativePath),
      );
      const srcDocumentContentText = await (
        await fetch(srcDocumentFileURL)
      ).text();
      const srcDocumentContent = new Window().document;

      // TODO generate proper html with frontmatter (use some markdown parser)
      const srcDocumentContentHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>
    ${srcDocumentFileRelativePath}
    </title>
  </head>
  <body>
    <pre>
      ${srcDocumentContentText}
    </pre>
  </body>
</html>
`;
      srcDocumentContent.write(srcDocumentContentHtml);

      const srcDocument = new SrcDocument(
        srcDocumentFileURL,
        srcDocumentContent,
      );
      srcDocuments.push(srcDocument);
    }

    return Promise.resolve(srcDocuments);
  }
}
