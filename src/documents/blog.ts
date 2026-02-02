import { Window as DOMWindow } from "happy-dom";
import { glob } from "glob";
import { Document, DocumentFactory, type API } from "#swooce";

export default class extends DocumentFactory {
  override async create(api: API) {
    // fetch inputs
    const allPostDocumentSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    // create document content
    const documentContentHTMLListItems = allPostDocumentSrcFileRelativePath.map(
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
      ${documentContentHTMLListItems}
    </ul>
  </body>
</html>
`;
    const documentContent = new DOMWindow().document;
    documentContent.write(documentSrcContentHTML);

    const document = new Document(new URL(import.meta.url), documentContent);

    return Promise.resolve(document);
  }
}
