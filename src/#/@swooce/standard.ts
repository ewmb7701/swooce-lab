import { writeFile, mkdir } from "fs/promises";
import { relative } from "path/posix";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  SrcDocument,
  SiteGenerator,
  type CommonAPI,
  type SrcSite,
  type SiteGeneratorAPI,
} from "#swooce";

/**
 * Resolve the target route path of a document.
 *
 * nb, route paths always start with "/".
 *
 * eg, /post/post-1.md.html
 */
function resolvePageTargetRoutePath(
  srcDocumentsDirAbsoluteURL: URL,
  srcDocumentFileAbsoluteURL: URL,
): string {
  return `/${relative(srcDocumentsDirAbsoluteURL.href, srcDocumentFileAbsoluteURL.href)}.html`;
}

/**
 * Resolve the absolute url of a document target file.
 */
function resolvePageTargetFileAsboluteURL(
  commonApi: CommonAPI,
  document: SrcDocument,
): URL {
  return new URL(
    `.${document.targetRoutePath}`,
    commonApi.paths.targetDocumentsDirAbsoluteURL,
  );
}

class StandardStaticSiteGenerator extends SiteGenerator {
  /**
   * Emit target files to output directory.
   * The emitted files are the final build artifacts.
   */
  async generate(api: SiteGeneratorAPI): Promise<void> {
    for (const document of this.srcSite.srcDocuments) {
      console.log(
        `generating document=${JSON.stringify(document, undefined, 2)}`,
      );

      const documentTargetFileAbsoluteURL =
        api.resolvers.resolvePageTargetFileAsboluteURL(api, document);

      const documentTargetFileHTML =
        document.srcContent.documentElement.outerHTML;

      console.log(
        `writing document 'route://${document.targetRoutePath}' -> '${documentTargetFileAbsoluteURL}'`,
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
  StandardStaticSiteGenerator,
  resolvePageTargetFileAsboluteURL,
  resolvePageTargetRoutePath,
};
