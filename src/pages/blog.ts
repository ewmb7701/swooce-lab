import { Window } from "happy-dom";
import { glob } from "glob";
import { Page, PageFactory, type CommonAPI } from "#swooce";

const TARGET_ROUTE_PATH = "/blog.html";

export default class extends PageFactory {
  override async create(api: CommonAPI) {
    const pageSrcGlob = glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });
    const pageSrcGlobRelativePaths = await pageSrcGlob;

    const pageWindow = new Window();
    const pageDocument = pageWindow.document;
    const pageSrcHTML = `
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
    ${pageSrcGlobRelativePaths.map((pageSrcGlobRelativePath) => {
      const pageSrcFileAbsoluteURL = new URL(
        import.meta.resolve(pageSrcGlobRelativePath),
      );

      const pageTargetFileRoutePath = api.resolvers.resolvePageTargetRoutePath(
        api.paths.pagesSrcDirAbsoluteURL,
        pageSrcFileAbsoluteURL,
      );

      return `<li><a href="${pageTargetFileRoutePath}">${pageSrcGlobRelativePath}</a></li>`;
    })}
    </ul>
  </body>
</html>
`;
    pageDocument.write(pageSrcHTML);

    const pageSrc = new Page(
      new URL(import.meta.url),
      pageDocument,
      TARGET_ROUTE_PATH,
    );

    return Promise.resolve(pageSrc);
  }
}
