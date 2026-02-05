import { glob } from "glob";
import { Window, Document } from "happy-dom";
import { type ISiteContext, type ArtifactRoute } from "swooce";
import { SrcFileArtifact, type IArtifactWithSrcContent } from "@swooce/core";

class BlogPageModuleArtifact
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
    const window = new Window();
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
  // resolve artifact dependencies
  const allPostArtifactSrcFileRelativePath = await glob(`./post/*.md`, {
    cwd: import.meta.dir,
    posix: true,
    dotRelative: true,
  });

  const allPostArtifactSrcFileRelativeURL =
    allPostArtifactSrcFileRelativePath.map((iPostPageSrcFileRelativePath) => {
      return new URL(import.meta.resolve(iPostPageSrcFileRelativePath));
    });

  const artifactRoute = siteContext.getArtifactRouteUsingSrcFileURL(
    new URL(import.meta.url),
  );
  const artifactSrcFileURL = new URL(import.meta.url);

  return new BlogPageModuleArtifact(
    artifactRoute,
    artifactSrcFileURL,
    allPostArtifactSrcFileRelativeURL,
  );
}
