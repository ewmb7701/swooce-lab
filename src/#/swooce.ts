import { writeFile } from "node:fs/promises";
import { type Document } from "happy-dom";

/**
 * source representation; must be generated.
 */
class Page {
  /**
   * page route relative to site base url.
   */
  readonly route: string;
  readonly document: Document;
  constructor(route: string, document: Document) {
    this.route = route;
    this.document = document;
  }
}

/**
 * source representation; must be generated.
 */
class Site {
  readonly pages: Array<Page>;
  constructor(pages: Array<Page>) {
    this.pages = pages;
  }
}

/**
 * Factory to create pages.
 *
 * By convention, the default module export of a path/ route.
 * This pattern enables multiple pages to be created for a route.
 * eg, `./src/site/routes/index.ts`, `./src/site/routes/[articles].ts`.
 */
abstract class PageFactory {
  /**
   * Returns an array.
   */
  abstract create(): Array<Page>;
}

abstract class SiteFactory {
  abstract create(): Site;
}

/**
 * Generates the static site.
 * By convention, the default module export of a site.
 * eg, `./src/site/index.ts`
 */
class SiteGenerator {
  readonly site: Site;
  readonly projectOutDirFileUrl: URL;

  constructor(site: Site, projectOutDirFileUrl: URL) {
    this.site = site;
    this.projectOutDirFileUrl = projectOutDirFileUrl;
  }

  /**
   * Emit static site files to output directory.
   * The emitted static site files are the final build artifacts.
   */
  async generate(): Promise<void> {
    for (const sitePage of this.site.pages) {
      console.log(`generating site page with route='${sitePage.route}'`);

      const sitePageFileUrl = new URL(
        sitePage.route,
        this.projectOutDirFileUrl,
      );
      const sitePageDocument = sitePage.document;
      const sitePageDocumentHtml = sitePageDocument.documentElement.getHTML();

      // emit site page html
      await writeFile(sitePageFileUrl, sitePageDocumentHtml, "utf-8");
    }
  }
}

export { PageFactory, SiteFactory, Page, Site, SiteGenerator };
