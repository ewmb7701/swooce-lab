import { type Document } from "happy-dom";

/**
 * source representation; must be target.
 */
class DocumentSrc {
  /**
   * Absolute URL of the source file.
   *
   * eg,`/home/eric/projects/my-cool-website/src/documents/posts/reasons-im-cool.md`
   */
  readonly fileURL: URL;
  /**
   * In `Document` form.
   */
  readonly content: Document;

  constructor(fileURL: URL, content: Document) {
    this.fileURL = fileURL;
    this.content = content;
  }
}

/**
 * source representation of site.
 */
class SiteSrc {
  readonly allDocumentSrc: Array<DocumentSrc>;
  constructor(allDocumentSrc: Array<DocumentSrc>) {
    this.allDocumentSrc = allDocumentSrc;
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
  readonly siteSrcDirURL: URL;

  /**
   * The absolute URL of the source documents directory.
   * Used to resolve routes of document files.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/documents/"
   *
   * By convention
   * - path of ./src
   */
  readonly documentSrcDirURL: URL;

  /**
   * The absolute URL of the target documents directory.
   *
   * By convention
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
  resolveDocumentTargetFileAsboluteURL: (
    api: API,
    documentSrc: DocumentSrc,
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
   * Emit static site files to target directory.
   * The emitted static site files are the final build artifacts.
   */
  abstract emit(api: API, siteSrc: SiteSrc): Promise<void>;
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
abstract class DocumentSrcFactory {
  /**
   * Returns an array.
   */
  abstract create(api: API): Promise<DocumentSrc | Array<DocumentSrc>>;
}

abstract class SiteSrcFactory {
  abstract create(api: API): Promise<SiteSrc>;
}

export {
  DocumentSrc,
  DocumentSrcFactory,
  SiteSrc,
  SiteSrcFactory,
  SiteEmitter,
  type API,
  type APIPaths,
  type APIResolvers,
};
