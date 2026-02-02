/**
 * {@link @swooce/core/VoidModule}
 */
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

interface ContextPaths {
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
  resolveModuleRoute: (ctx: Context, moduleSrcFileURL: URL) => string;

  /**
   * Resolve the absolute target URL of a module.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/document/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/document/posts/post-1.md`.
   */
  resolveModuleTargetFileURL: (ctx: Context, module: Module) => URL;
}

/**
 * Site-wide context shared between all modules, like project paths and resolvers.
 *
 * Provided to all primitives.
 */
interface Context {
  readonly paths: ContextPaths;
}

abstract class ModuleEmitter<TModule extends Module> {
  /**
   * Emit site files to target directory.
   * The emitted public site files are the final build artifacts.
   */
  abstract emit(ctx: Context, module: TModule): Promise<void>;
}

abstract class ModuleResolver<TModule extends Module> {
  /**
   * Returns an array.
   */
  abstract resolve(ctx: Context): Promise<TModule | Array<TModule>>;
}

export {
  Module,
  ModuleResolver,
  ModuleEmitter,
  type Context,
  type ContextPaths,
};
