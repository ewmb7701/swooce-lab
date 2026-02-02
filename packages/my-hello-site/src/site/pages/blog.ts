import { Document, Window as DOMWindow } from "happy-dom";
import { ModuleResolver, type Context } from "swooce";
import { ContentModule } from "@swooce/core";
import { glob } from "glob";

class BlogPageModule extends ContentModule<Document> {
  readonly allPostPageModuleSrcURL: URL[];

  override async fetch(ctx: Context): Promise<Document> {
    // create document content
    const documentContentAllPostPageHTMLListItems =
      this.allPostPageModuleSrcURL.map((iModuleSrcFileURL) => {
        const iDocumentRoute = ctx.paths.resolveModuleRoute(
          ctx,
          iModuleSrcFileURL,
        );

        return `<li><a href="${iDocumentRoute}">${iDocumentRoute}</a></li>`;
      });
    const contentDocumentHTML = `
<!DOCTYPE html>
<html>
  <head>
    <title>
      Blog
    </title>
  </head>
  <body>
    <p>Hello! This is my blog website. Based on Astro.</p>
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

  constructor(srcFileURL: URL, allPostPageModuleSrcURL: URL[]) {
    super(srcFileURL);
    this.allPostPageModuleSrcURL = allPostPageModuleSrcURL;
  }
}

export default class extends ModuleResolver<BlogPageModule> {
  override async resolve(_ctx: Context) {
    // resolve module dependencies
    const allPostModuleSrcFileRelativePath = await glob(`./post/*.md`, {
      cwd: import.meta.dir,
      posix: true,
      dotRelative: true,
    });

    const allPostModuleSrcFileRelativeURL =
      allPostModuleSrcFileRelativePath.map((iPostPageSrcFileRelativePath) => {
        return new URL(import.meta.resolve(iPostPageSrcFileRelativePath));
      });

    return new BlogPageModule(
      new URL(import.meta.url),
      allPostModuleSrcFileRelativeURL,
    );
  }
}
