abstract class Module {
  /**
   * Absolute URL of the source file of this module.
   *
   * eg,`/home/eric/projects/my-cool-website/src/document/posts/reasons-im-cool.md`
   */
  readonly srcFileURL: URL;

  constructor(srcFileURL: URL) {
    this.srcFileURL = srcFileURL;
  }
}

abstract class ContentModule<TContent> extends Module {
  /**
   * Fetch the content of the src file of this module.
   */
  abstract fetch(api: API): Promise<TContent>;
}

interface APIPaths {
  /**
   * The absolute URL of the site source directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/src/"
   */
  readonly srcDirURL: URL;

  /**
   * The absolute URL of the document target directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/dist/"
   *
   * By convention:
   * - path of ./dist
   */
  readonly targetDirURL: URL;

  /**
   * Resolve the route of a module using the module src file URL.
   */
  resolveModuleRoute: (api: API, moduleSrcFileURL: URL) => string;

  /**
   * Resolve the absolute target URL of a module.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/document/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/document/posts/post-1.md`.
   */
  resolveModuleTargetFileURL: (api: API, module: Module) => URL;
}

/**
 * Site API.
 *
 * Contains site-wide policies, like routes.
 *
 * Provided to all modules and pipelines.
 */
interface API {
  readonly paths: APIPaths;
}

abstract class ModuleEmitter<TModule extends Module> {
  /**
   * Emit site files to target directory.
   * The emitted static site files are the final build artifacts.
   */
  abstract emit(api: API, module: TModule): Promise<void>;
}

abstract class ModuleResolver<TModule extends Module> {
  /**
   * Returns an array.
   */
  abstract resolve(api: API): Promise<TModule | Array<TModule>>;
}

export {
  Module,
  ModuleResolver,
  ModuleEmitter,
  ContentModule,
  type API,
  type APIPaths,
};
