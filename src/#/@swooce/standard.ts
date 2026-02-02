import { writeFile, mkdir } from "fs/promises";
import { relative } from "path/posix";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  SrcDocument,
  SiteEmitter,
  type API,
  type APIResolvers,
  type SrcSite,
} from "#swooce";

const staticSiteResolvers = {
  /**
   * Equal to the relative URL path of the source document file wrt "/src/documents" dir.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/documents/posts/post-1.md` to `/posts/post-1.md.html`.
   */
  resolveSrcDocumentTargetRoute: function (
    api: API,
    srcDocumentFileURL: URL,
  ): string {
    return `/${relative(api.paths.srcDocumentsDirURL.href, srcDocumentFileURL.href)}.html`;
  },
  /**
   * Resolve the absolute target URL of the srcDocument file.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/documents/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/documents/posts/post-1.md`.
   */
  resolveTargetDocumentFileAsboluteURL: function (
    api: API,
    srcDocument: SrcDocument,
  ): URL {
    const documentTargetRoutePath = this.resolveSrcDocumentTargetRoute(
      api,
      srcDocument.srcFileURL,
    );

    return new URL(
      `.${documentTargetRoutePath}`,
      api.paths.targetDocumentsDirURL,
    );
  },
} satisfies APIResolvers;

class StaticSiteEmitter extends SiteEmitter {
  /**
   * Emit target files to output directory.
   * The emitted files are the final build artifacts.
   */
  async emit(api: API, srcSite: SrcSite): Promise<void> {
    for (const src of srcSite.srcDocument) {
      console.log(`generating document=${JSON.stringify(src, undefined, 2)}`);

      const targetDocumentFileURL =
        api.resolvers.resolveTargetDocumentFileAsboluteURL(api, src);

      const targetDocumentFileHTML = src.srcContent.documentElement.outerHTML;

      const targetDocumentFileAbsoluteUrl = dirname(
        fileURLToPath(targetDocumentFileURL),
      );

      await mkdir(targetDocumentFileAbsoluteUrl, {
        recursive: true,
      });
      await writeFile(targetDocumentFileURL, targetDocumentFileHTML, "utf-8");
    }
  }

  constructor() {
    super();
  }
}

export { StaticSiteEmitter, staticSiteResolvers };
