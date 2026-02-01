import { Window } from "happy-dom";
import { glob } from "glob";
import { SrcDocument, SrcDocumentFactory, type CommonAPI } from "#swooce";

const TARGET_ROUTE_PATH = "/blog.html";

export default class extends SrcDocumentFactory {
  override async create(api: CommonAPI) {
    // fetch inputs
    const inputFilesRelativeGlob = glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });
    const inputFilesRelativePaths = await inputFilesRelativeGlob;

    // create document content
    const srcDocumentContentHTMLLists = inputFilesRelativePaths.map(
      (srcDocumentGlobRelativePath) => {
        const srcDocumentFileAbsoluteURL = new URL(
          import.meta.resolve(srcDocumentGlobRelativePath),
        );

        const targetFileRoutePath = api.resolvers.resolvePageTargetRoutePath(
          api.paths.srcDocumentsDirAbsoluteURL,
          srcDocumentFileAbsoluteURL,
        );

        return `<li><a href="${targetFileRoutePath}">${srcDocumentGlobRelativePath}</a></li>`;
      },
    );
    const srcDocumentContentHTML = `
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
      ${srcDocumentContentHTMLLists}
    </ul>
  </body>
</html>
`;
    const srcDocumentContent = new Window().document;
    srcDocumentContent.write(srcDocumentContentHTML);

    const srcDocument = new SrcDocument(
      new URL(import.meta.url),
      srcDocumentContent,
      TARGET_ROUTE_PATH,
    );

    return Promise.resolve(srcDocument);
  }
}
