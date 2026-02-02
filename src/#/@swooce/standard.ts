import { writeFile, mkdir } from "fs/promises";
import { relative } from "path/posix";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  Document,
  SiteEmitter,
  type API,
  type APIResolvers,
  type Site,
} from "#swooce";

const staticSiteResolvers = {
  /**
   * Equal to the relative URL path of the source document file wrt "/src/documents" dir.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/documents/posts/post-1.md` to `/posts/post-1.md.html`.
   */
  resolveDocumentRoute: function (api: API, documentSrcFileURL: URL): string {
    return `/${relative(api.paths.documentSrcDirURL.href, documentSrcFileURL.href)}.html`;
  },
  /**
   * Resolve the absolute target URL of the documentSrc file.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/documents/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/documents/posts/post-1.md`.
   */
  resolveDocumentTargetFileAsboluteURL: function (
    api: API,
    documentSrc: Document,
  ): URL {
    const documentRoute = this.resolveDocumentRoute(
      api,
      documentSrc.srcFileURL,
    );

    console.log(documentRoute);
    console.log(api.paths.documentTargetDirURL);

    return new URL(`.${documentRoute}`, api.paths.documentTargetDirURL);
  },
} satisfies APIResolvers;

class StaticSiteEmitter extends SiteEmitter {
  /**
   * Emit target files to output directory.
   * The emitted files are the final build artifacts.
   */
  async emit(api: API, site: Site): Promise<void> {
    for (const document of site.allDocument) {
      console.log(
        `generating document=${JSON.stringify(document, undefined, 2)}`,
      );

      const documentTargetFileURL =
        api.resolvers.resolveDocumentTargetFileAsboluteURL(api, document);

      const documentTargetFileHTML = document.content.documentElement.outerHTML;

      const documentTargetFileAbsoluteUrl = dirname(
        fileURLToPath(documentTargetFileURL),
      );

      await mkdir(documentTargetFileAbsoluteUrl, {
        recursive: true,
      });
      await writeFile(documentTargetFileURL, documentTargetFileHTML, "utf-8");
    }
  }

  constructor() {
    super();
  }
}

export { StaticSiteEmitter, staticSiteResolvers };
