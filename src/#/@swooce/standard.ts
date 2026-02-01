import { writeFile, mkdir } from "fs/promises";
import { relative } from "path/posix";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  SrcDocument,
  SiteEmitter,
  type CommonAPI,
  type SrcSite,
  type SiteEmitterAPI,
} from "#swooce";

/**
 * Resolve the target route path of a document.
 *
 * nb, route paths always start with "/".
 *
 * eg, /post/post-1.md.html
 */
function resolveDocumentRoute(
  srcDocumentsDirAbsoluteURL: URL,
  srcDocumentFileAbsoluteURL: URL,
): string {
  return `/${relative(srcDocumentsDirAbsoluteURL.href, srcDocumentFileAbsoluteURL.href)}.html`;
}

/**
 * Resolve the absolute url of a document target file.
 */
function resolveTargetFileAsboluteURL(
  commonApi: CommonAPI,
  document: SrcDocument,
): URL {
  return new URL(
    `.${document.targetRoutePath}`,
    commonApi.paths.targetDocumentsDirAbsoluteURL,
  );
}

class StandardStaticSiteEmitter extends SiteEmitter {
  /**
   * Emit target files to output directory.
   * The emitted files are the final build artifacts.
   */
  async emit(api: SiteEmitterAPI): Promise<void> {
    for (const src of this.srcSite.srcDocuments) {
      console.log(`generating document=${JSON.stringify(src, undefined, 2)}`);

      const documentTargetFileAbsoluteURL =
        api.resolvers.resolvePageTargetFileAsboluteURL(api, src);

      const documentTargetFileHTML = src.srcContent.documentElement.outerHTML;

      console.log(
        `writing document 'route://${src.targetRoutePath}' -> '${documentTargetFileAbsoluteURL}'`,
      );

      const documentTargetFileAbsoluteUrl = dirname(
        fileURLToPath(documentTargetFileAbsoluteURL),
      );

      await mkdir(documentTargetFileAbsoluteUrl, {
        recursive: true,
      });
      await writeFile(
        documentTargetFileAbsoluteURL,
        documentTargetFileHTML,
        "utf-8",
      );
    }
  }

  constructor(site: SrcSite) {
    super(site);
  }
}

export {
  StandardStaticSiteEmitter,
  resolveTargetFileAsboluteURL,
  resolveDocumentRoute,
};
