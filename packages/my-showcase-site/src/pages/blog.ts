import { Document, Window as DOMWindow } from "happy-dom";
import { glob } from "glob";
import { type ArtifactRoute, type ISiteContext } from "swooce";
import { SrcFileArtifact, type IArtifactWithSrcContent } from "@swooce/core";

class BlogPagesArtifact
  extends SrcFileArtifact
  implements IArtifactWithSrcContent<Document>
{
  readonly allPostPageArtifactSrcURL: URL[];

  async fetchSrcContent(siteContext: ISiteContext): Promise<Document> {
    // create document content
    const documentContentAllPostPageHTMLListItems =
      this.allPostPageArtifactSrcURL.map((iArtifactSrcFileURL) => {
        const iDocumentRoute =
          siteContext.getArtifactRouteUsingSrcFileURL(iArtifactSrcFileURL);

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

  constructor(
    route: ArtifactRoute,
    srcFileURL: URL,
    allPostPageArtifactSrcURL: URL[],
  ) {
    super(route, srcFileURL);
    this.allPostPageArtifactSrcURL = allPostPageArtifactSrcURL;
  }
}

export default async function (siteContext: ISiteContext) {
  const allPostArtifactSrcFileRelativePath = await glob(`./post/*.md`, {
    cwd: import.meta.dir,
    posix: true,
    dotRelative: true,
  });
  const allPostArtifactSrcFileRelativeURL =
    allPostArtifactSrcFileRelativePath.map((iPostPageSrcFileRelativePath) => {
      return new URL(import.meta.resolve(iPostPageSrcFileRelativePath));
    });
  // TODO actualize post artifact routes here

  const srcFileURL = new URL(import.meta.url);
  const route = siteContext.getArtifactRouteUsingSrcFileURL(srcFileURL);
  return new BlogPagesArtifact(
    route,
    srcFileURL,
    allPostArtifactSrcFileRelativeURL,
  );
}
