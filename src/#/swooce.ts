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
  readonly srcFileURL: URL;
  /**
   * In `Document` form.
   */
  readonly srcContent: Document;

  constructor(srcFileURL: URL, srcContent: Document) {
    this.srcFileURL = srcFileURL;
    this.srcContent = srcContent;
  }
}

/**
 * source representation of site.
 */
class SrcSite {
  readonly srcDocument: Array<SrcDocument>;
  constructor(srcDocument: Array<SrcDocument>) {
    this.srcDocument = srcDocument;
  }
}

interface APIPaths {
  /**
   * The absolute URL of the source site directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   *
   * By convention
   * - path of ./src
   * - contains `site.ts` and `./documents`.
   */
  readonly srcSiteDirURL: URL;

  /**
   * The absolute URL of the source documents directory.
   * Used to resolve routes of document files.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/documents/"
   *
   * By convention
   * - path of ./src
   */
  readonly srcDocumentsDirURL: URL;

  /**
   * The absolute URL of the target documents directory.
   *
   * By convention
   * - path of ./dist
   */
  readonly targetDocumentsDirURL: URL;
}

/**
 * Common resolvers used by multiple build stages.
 */
interface APIResolvers {
  /**
   * Resolve the relative target route of the srcDocument file
   */
  resolveSrcDocumentTargetRoute: (api: API, srcDocumentFileURL: URL) => string;

  /**
   * Resolve the absolute target URL of the srcDocument file.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/documents/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/documents/posts/post-1.md`.
   */
  resolveTargetDocumentFileAsboluteURL: (
    api: API,
    srcDocument: SrcDocument,
  ) => URL;
}

/**
 * common API used by multiple build stages.
 */
interface API {
  readonly paths: APIPaths;
  readonly resolvers: APIResolvers;
}

/**
 * Emitter to emit static site files.
 * By convention, the default module export of `./src/site.[js|ts]`
 */
abstract class SiteEmitter {
  /**
   * Emit static site files to output directory.
   * The emitted static site files are the final build artifacts.
   */
  abstract emit(api: API, srcSite: SrcSite): Promise<void>;
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
  abstract create(api: API): Promise<SrcDocument | Array<SrcDocument>>;
}

abstract class SrcSiteFactory {
  abstract create(api: API): Promise<SrcSite>;
}

export {
  SrcDocument,
  SrcDocumentFactory,
  SrcSite,
  SrcSiteFactory,
  SiteEmitter,
  type API,
  type APIPaths,
  type APIResolvers,
};
