import { glob } from "glob";
import { Window } from "happy-dom";
import { Page, PageFactory, type CommonAPI } from "#swooce";

export default class extends PageFactory {
  override async create(api: CommonAPI) {
    const pageSrcFileRelativePaths = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    let pages = [];
    for await (const pageSrcFileRelativePath of pageSrcFileRelativePaths) {
      const pageSrcFileAbsoluteURL = new URL(
        import.meta.resolve(pageSrcFileRelativePath),
      );
      const pageSrcText = await (await fetch(pageSrcFileAbsoluteURL)).text();
      const postPageWindow = new Window();
      const pageDocument = postPageWindow.document;

      // TODO generate proper html with frontmatter (use some markdown parser)
      const pageHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>
    ${pageSrcFileRelativePath}
    </title>
  </head>
  <body>
    <pre>
      ${pageSrcText}
    </pre>
  </body>
</html>
`;
      pageDocument.write(pageHtml);

      const pageTargetRoute = api.resolvers.resolvePageTargetRoutePath(
        api.paths.pagesSrcDirAbsoluteURL,
        pageSrcFileAbsoluteURL,
      );

      const postPage = new Page(
        new URL(import.meta.url),
        pageDocument,
        pageTargetRoute,
      );
      pages.push(postPage);
    }

    return Promise.resolve(pages);
  }
}
