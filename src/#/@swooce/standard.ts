import { writeFile, mkdir } from "fs/promises";
import { relative } from "path/posix";
import { dirname } from "path";
import { fileURLToPath } from "url";
import {
  Page,
  SiteGenerator,
  type CommonAPI,
  type Site,
  type SiteGeneratorAPI,
} from "#swooce";

/**
 * Resolve the target route path of a page.
 *
 * nb, route paths always start with "/".
 *
 * eg, /post/post-1.md.html
 */
function resolvePageTargetRoutePath(
  pagesSrcDirAbsoluteURL: URL,
  pageSrcFileAbsoluteURL: URL,
): string {
  return `/${relative(pagesSrcDirAbsoluteURL.href, pageSrcFileAbsoluteURL.href)}.html`;
}

/**
 * Resolve the absolute url of a page target file.
 */
function resolvePageTargetFileAsboluteURL(
  commonApi: CommonAPI,
  page: Page,
): URL {
  return new URL(
    `.${page.targetRoutePath}`,
    commonApi.paths.pagesTargetDirAbsoluteURL,
  );
}

class StandardStaticSiteGenerator extends SiteGenerator {
  /**
   * Emit target files to output directory.
   * The emitted files are the final build artifacts.
   */
  async generate(api: SiteGeneratorAPI): Promise<void> {
    for (const page of this.site.pages) {
      console.log(`generating page=${JSON.stringify(page, undefined, 2)}`);

      const pageTargetFileAbsoluteURL =
        api.resolvers.resolvePageTargetFileAsboluteURL(api, page);

      const pageTargetFileHTML = page.srcDocument.documentElement.outerHTML;

      console.log(
        `writing page 'route://${page.targetRoutePath}' -> '${pageTargetFileAbsoluteURL}'`,
      );

      const pageTargetFileAbsoluteUrl = dirname(
        fileURLToPath(pageTargetFileAbsoluteURL),
      );

      await mkdir(pageTargetFileAbsoluteUrl, {
        recursive: true,
      });
      await writeFile(pageTargetFileAbsoluteURL, pageTargetFileHTML, "utf-8");
    }
  }

  constructor(site: Site) {
    super(site);
  }
}

export {
  StandardStaticSiteGenerator,
  resolvePageTargetFileAsboluteURL,
  resolvePageTargetRoutePath,
};
