import { glob } from "glob";
import { Window, Document } from "happy-dom";
import { type PipelineContext, type Route } from "swooce";
import { SrcFileArtifact, type IArtifactWithSrcContent } from "@swooce/core";

class BlogPageModuleArtifact
  extends SrcFileArtifact
  implements IArtifactWithSrcContent<Document>
{
  readonly allPostPageArtifactSrcURL: URL[];

  async fetchSrcContent(ctx: PipelineContext): Promise<Document> {
    // create document content
    const documentContentAllPostPageHTMLListItems =
      this.allPostPageArtifactSrcURL.map((iArtifactSrcFileURL) => {
        const iDocumentRoute =
          ctx.getArtifactRouteUsingSrcFileURL(iArtifactSrcFileURL);

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

  constructor(route: Route, srcFileURL: URL, allPostPageArtifactSrcURL: URL[]) {
    super(route, srcFileURL);
    this.allPostPageArtifactSrcURL = allPostPageArtifactSrcURL;
  }
}

export default async function (ctx: PipelineContext) {
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

  const artifactRoute = ctx.getArtifactRouteUsingSrcFileURL(
    new URL(import.meta.url),
  );
  const artifactSrcFileURL = new URL(import.meta.url);

  return new BlogPageModuleArtifact(
    artifactRoute,
    artifactSrcFileURL,
    allPostArtifactSrcFileRelativeURL,
  );
}
