import { Window } from "happy-dom";
import { glob } from "glob";
import { DocumentSrc, DocumentSrcFactory, type API } from "#swooce";

export default class extends DocumentSrcFactory {
  override async create(api: API) {
    // fetch inputs
    const allInputPostDocumentSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    // create document content
    const documentSrcContentHTMLListItems =
      allInputPostDocumentSrcFileRelativePath.map(
        (iDocumentSrcGlobRelativePath) => {
          const iDocumentSrcFileURL = new URL(
            import.meta.resolve(iDocumentSrcGlobRelativePath),
          );

          const iDocumentRoute = api.resolvers.resolveDocumentRoute(
            api,
            iDocumentSrcFileURL,
          );

          return `<li><a href="${iDocumentRoute}">${iDocumentSrcGlobRelativePath}</a></li>`;
        },
      );
    const documentSrcContentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Blog
    </title>
  </head>
  <body>
    <p>This is where I will post about my journey learning Astro.</p>
    <ul>
      ${documentSrcContentHTMLListItems}
    </ul>
  </body>
</html>
`;
    const documentSrcContent = new Window().document;
    documentSrcContent.write(documentSrcContentHTML);

    const documentSrc = new DocumentSrc(
      new URL(import.meta.url),
      documentSrcContent,
    );

    return Promise.resolve(documentSrc);
  }
}
