import { glob } from "glob";
import { Window } from "happy-dom";
import { SrcDocument, SrcDocumentFactory, type CommonAPI } from "#swooce";

export default class extends SrcDocumentFactory {
  override async create(api: CommonAPI) {
    // fetch inputs
    const srcDocumentsFileRelativePaths = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    let srcDocuments = [];
    for await (const srcDocumentFileRelativePath of srcDocumentsFileRelativePaths) {
      const srcDocumentFileAbsoluteURL = new URL(
        import.meta.resolve(srcDocumentFileRelativePath),
      );
      const srcDocumentContentText = await (
        await fetch(srcDocumentFileAbsoluteURL)
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

      const targetDocumentRoutePath = api.resolvers.resolvePageTargetRoutePath(
        api.paths.srcDocumentsDirAbsoluteURL,
        srcDocumentFileAbsoluteURL,
      );

      const srcDocument = new SrcDocument(
        new URL(import.meta.url),
        srcDocumentContent,
        targetDocumentRoutePath,
      );
      srcDocuments.push(srcDocument);
    }

    return Promise.resolve(srcDocuments);
  }
}
