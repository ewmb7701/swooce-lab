import { Document, Window as DOMWindow } from "happy-dom";
import { glob } from "glob";
import { Artifact, type PipelineContext } from "swooce";
import { type IArtifactWithSrcFileContent } from "@swooce/core";

class BlogPagesArtifact
  extends Artifact
  implements IArtifactWithSrcFileContent<Document>
{
  readonly allPostPageArtifactSrcURL: URL[];

  async fetchSrcFileContent(ctx: PipelineContext): Promise<Document> {
    // create document content
    const documentContentAllPostPageHTMLListItems =
      this.allPostPageArtifactSrcURL.map((iArtifactSrcFileURL) => {
        const iDocumentRoute = ctx.getArtifactRoute(ctx, iArtifactSrcFileURL);

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

  constructor(srcFileURL: URL, allPostPageArtifactSrcURL: URL[]) {
    super(srcFileURL);
    this.allPostPageArtifactSrcURL = allPostPageArtifactSrcURL;
  }
}

export default async function (_ctx: PipelineContext) {
  const allPostArtifactSrcFileRelativePath = await glob(`./post/*.md`, {
    cwd: import.meta.dir,
    posix: true,
    dotRelative: true,
  });

  const allPostArtifactSrcFileRelativeURL =
    allPostArtifactSrcFileRelativePath.map((iPostPageSrcFileRelativePath) => {
      return new URL(import.meta.resolve(iPostPageSrcFileRelativePath));
    });

  return new BlogPagesArtifact(
    new URL(import.meta.url),
    allPostArtifactSrcFileRelativeURL,
  );
}
