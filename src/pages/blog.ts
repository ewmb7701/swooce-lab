import { Document, Window as DOMWindow } from "happy-dom";
import { ContentModule, ModuleResolver, type API } from "#swooce";
import { glob } from "glob";

class BlogPageModule extends ContentModule<Document> {
  readonly allPostPageSrcFileRelativePath: string[];

  override async fetch(api: API): Promise<Document> {
    // create document content
    const documentContentAllPostPageHTMLListItems =
      this.allPostPageSrcFileRelativePath.map(
        (iPostPageSrcFileRelativePath) => {
          const iModuleSrcFileURL = new URL(
            import.meta.resolve(iPostPageSrcFileRelativePath),
          );

          const iDocumentRoute = api.paths.resolveModuleRoute(
            api,
            iModuleSrcFileURL,
          );

          return `<li><a href="${iDocumentRoute}">${iPostPageSrcFileRelativePath}</a></li>`;
        },
      );
    const contentDocumentHTML = `
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
      ${documentContentAllPostPageHTMLListItems}
    </ul>
  </body>
</html>
`;
    const window = new DOMWindow();
    const document = window.document;
    document.write(contentDocumentHTML);

    await window.happyDOM.waitUntilComplete();

    return document;
  }

  constructor(srcFileURL: URL, allPostPageSrcFileRelativePath: string[]) {
    super(srcFileURL);
    this.allPostPageSrcFileRelativePath = allPostPageSrcFileRelativePath;
  }
}

export default class extends ModuleResolver<BlogPageModule> {
  override async resolve(_api: API) {
    // resolve content deps
    const allPostModuleSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    return new BlogPageModule(
      new URL(import.meta.url),
      allPostModuleSrcFileRelativePath,
    );
  }
}
