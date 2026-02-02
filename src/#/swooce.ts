import { type Document as DOMDocument } from "happy-dom";

class Document {
  /**
   * Absolute URL of the source file of this document.
   *
   * eg,`/home/eric/projects/my-cool-website/src/documents/posts/reasons-im-cool.md`
   */
  readonly srcFileURL: URL;
  /**
   * Content of this document.
   */
  readonly content: DOMDocument;

  constructor(srcFileURL: URL, content: DOMDocument) {
    this.srcFileURL = srcFileURL;
    this.content = content;
  }
}

/**
 * Representation of site.
 */
class Site {
  readonly allDocument: Array<Document>;
  constructor(allDocument: Array<Document>) {
    this.allDocument = allDocument;
  }
}

interface APIPaths {
  /**
   * The absolute URL of the site source directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   *
   * By convention:
   * - path of ./src
   * - contains `site.ts` and `./documents`.
   */
  readonly srcDirURL: URL;

  /**
   * The absolute URL of the documents source directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/documents/"
   *
   * By convention:
   * - path of ./src
   */
  readonly documentSrcDirURL: URL;

  /**
   * The absolute URL of the documents target directory.
   *
   * By convention:
   * - path of ./dist
   */
  readonly documentTargetDirURL: URL;
}

/**
 * Common resolvers used by multiple build stages.
 */
interface APIResolvers {
  /**
   * Resolve the route of a document using the document src file URL.
   */
  resolveDocumentRoute: (api: API, documentSrcFileURL: URL) => string;

  /**
   * Resolve the absolute target URL of a document.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/documents/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/documents/posts/post-1.md`.
   */
  resolveDocumentTargetFileAsboluteURL: (api: API, document: Document) => URL;
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
   * Emit static site files to target directory.
   * The emitted static site files are the final build artifacts.
   */
  abstract emit(api: API, site: Site): Promise<void>;
}

/**
 * Factory to create documents.
 *
 * By convention, used for the file-based routes pattern:
 * - the default export of all modules in `./src/documents/*.[js|ts]`
 * - the route of every created document should match the relative path of the source file.
 *   - eg, `./src/documents/index.ts` should export a `DocumentFactory` which creates a single document with route `/index.html`.
 *   - eg, `./src/documents/post.ts` should export a `DocumentFactory` which creates a document with route `/posts/[postId].md.html` for each file `./src/documents/posts/*.md`.
 */
abstract class DocumentFactory {
  /**
   * Returns an array.
   */
  abstract create(api: API): Promise<Document | Array<Document>>;
}

abstract class SiteFactory {
  abstract create(api: API): Promise<Site>;
}

export {
  Document,
  DocumentFactory,
  Site,
  SiteFactory,
  SiteEmitter,
  type API,
  type APIPaths,
  type APIResolvers,
};
