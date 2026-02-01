import { type Document } from "happy-dom";

/**
 * source representation; must be target.
 */
class SrcDocument {
  /**
   * Absolute URL of the source file.
   *
   * eg,`/home/eric/projects/my-cool-website/src/documents/posts/reasons-im-cool.md`
   */
  readonly srcFileAbsoluteURL: URL;
  /**
   * In `Document` form.
   */
  readonly srcContent: Document;
  /**
   * relative to site base url.
   *
   * eg, `/posts/reasons-im-cool.md.html`
   */
  readonly targetRoutePath: string;

  constructor(
    srcFileAbsoluteURL: URL,
    srcContent: Document,
    targetRoutePath: string,
  ) {
    this.srcFileAbsoluteURL = srcFileAbsoluteURL;
    this.srcContent = srcContent;
    this.targetRoutePath = targetRoutePath;
  }
}

/**
 * source representation of site.
 */
class SrcSite {
  readonly srcDocuments: Array<SrcDocument>;
  constructor(documents: Array<SrcDocument>) {
    this.srcDocuments = documents;
  }
}

interface CommonAPIPaths {
  /**
   * The absolute URL of the source site directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   *
   * By convention
   * - path of ./src
   * - contains `site.ts` and `./documents`.
   */
  readonly srcSiteDirAbsoluteURL: URL;

  /**
   * The absolute URL of the source documents directory.
   * Used to resolve routes of document files.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/documents/"
   *
   * By convention
   * - path of ./src
   */
  readonly srcDocumentsDirAbsoluteURL: URL;

  /**
   * The absolute URL of the target documents directory.
   *
   * By convention
   * - path of ./dist
   */
  readonly targetDocumentsDirAbsoluteURL: URL;
}

/**
 * Common resolvers used by multiple build stages.
 */
interface CommonAPIResolvers {
  resolvePageTargetRoutePath: (
    srcDocumentsDirAbsoluteURL: URL,
    srcDocumentFileAbsoluteURL: URL,
  ) => string;

  resolvePageTargetFileAsboluteURL: (
    api: CommonAPI,
    document: SrcDocument,
  ) => URL;
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
  readonly srcSite: SrcSite;

  constructor(srcSite: SrcSite) {
    this.srcSite = srcSite;
  }

  /**
   * Emit static site files to output directory.
   * The emitted static site files are the final build artifacts.
   */
  abstract generate(api: SiteGeneratorAPI): Promise<void>;
}

/**
 * Factory to create source documents.
 *
 * By convention, used for the file-based routes pattern:
 * - the default export of all modules in `./src/documents/*.[js|ts]`
 * - the route of every created document should match the relative path of the source file.
 *   - eg, `./src/documents/index.ts` should export a `DocumentFactory` which creates a single document with route `/index.html`.
 *   - eg, `./src/documents/post.ts` should export a `DocumentFactory` which creates a document with route `/posts/[postId].md.html` for each file `./src/documents/posts/*.md`.
 */
abstract class SrcDocumentFactory {
  /**
   * Returns an array.
   */
  abstract create(api: CommonAPI): Promise<SrcDocument | Array<SrcDocument>>;
}

abstract class SrcSiteFactory {
  abstract create(api: CommonAPI): Promise<SrcSite>;
}

export {
  SrcDocumentFactory,
  SrcSiteFactory,
  SrcDocument,
  SrcSite,
  SiteGenerator,
  type CommonAPI,
  type CommonAPIPaths,
  type CommonAPIResolvers,
  type SiteGeneratorAPI,
};
