import { type Document } from "happy-dom";

/**
 * source representation; must be target.
 */
class Page {
  /**
   * Absolute URL of the source file.
   *
   * eg,`/home/eric/projects/my-cool-website/src/pages/posts/reasons-im-cool.md`
   */
  readonly srcFileAbsoluteURL: URL;
  readonly srcDocument: Document;
  /**
   * relative to site base url.
   *
   * eg, `/posts/reasons-im-cool.md.html`
   */
  readonly targetRoutePath: string;

  constructor(
    srcFileAbsoluteURL: URL,
    document: Document,
    targetRoutePath: string,
  ) {
    this.srcFileAbsoluteURL = srcFileAbsoluteURL;
    this.srcDocument = document;
    this.targetRoutePath = targetRoutePath;
  }
}

/**
 * source representation; must be target.
 */
class Site {
  readonly pages: Array<Page>;
  constructor(pages: Array<Page>) {
    this.pages = pages;
  }
}

interface CommonAPIPaths {
  /**
   * The absolute URL of the "site" directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   *
   * By convention
   * - path of ./src
   * - contains `site.ts` and `./pages`.
   */
  readonly siteSrcDirAbsoluteURL: URL;

  /**
   * The absolute URL of the "pages" directory.
   * Used to resolve routes of page files.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/pages/"
   *
   * By convention
   * - path of ./src
   */
  readonly pagesSrcDirAbsoluteURL: URL;

  /**
   * The absolute URL of the target directory.
   *
   * By convention
   * - path of ./dist
   */
  readonly pagesTargetDirAbsoluteURL: URL;
}

/**
 * Common resolvers used by multiple build stages.
 */
interface CommonAPIResolvers {
  resolvePageTargetRoutePath: (
    pagesSrcDirAbsoluteURL: URL,
    pageSrcFileAbsoluteURL: URL,
  ) => string;

  resolvePageTargetFileAsboluteURL: (api: CommonAPI, page: Page) => URL;
}

/**
 * common API used by multiple build stages.
 */
interface CommonAPI {
  readonly paths: CommonAPIPaths;
  readonly resolvers: CommonAPIResolvers;
}

/**
 * Api used by site generation stage.
 */
interface SiteGeneratorAPI {
  readonly paths: CommonAPIPaths;
  readonly resolvers: CommonAPIResolvers;
}

/**
 * Generator to emit static site files.
 * By convention, the default module export of `./src/site.[js|ts]`
 */
abstract class SiteGenerator {
  readonly site: Site;

  constructor(site: Site) {
    this.site = site;
  }

  /**
   * Emit static site files to output directory.
   * The emitted static site files are the final build artifacts.
   */
  abstract generate(api: SiteGeneratorAPI): Promise<void>;
}

/**
 * Factory to create pages.
 *
 * By convention, used for the file-based routes pattern:
 * - the default export of all modules in `./src/pages/*.[js|ts]`
 * - the route of every created page should match the relative path of the source file.
 *   - eg, `./src/pages/index.ts` should export a `PageFactory` which creates a single page with route `/index.html`.
 *   - eg, `./src/pages/post.ts` should export a `PageFactory` which creates a page with route `/posts/[postId].md.html` for each file `./src/pages/posts/*.md`.
 */
abstract class PageFactory {
  /**
   * Returns an array.
   */
  abstract create(api: CommonAPI): Promise<Page | Array<Page>>;
}

abstract class SiteFactory {
  abstract create(api: CommonAPI): Promise<Site>;
}

export {
  PageFactory,
  SiteFactory,
  Page,
  Site,
  SiteGenerator,
  type CommonAPI,
  type CommonAPIPaths,
  type CommonAPIResolvers,
  type SiteGeneratorAPI,
};
