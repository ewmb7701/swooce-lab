import { glob } from "glob";
import { copyFile } from "node:fs/promises";
import { dirname } from "node:path/posix";
import { Module, ModuleEmitter, ModuleResolver, type Context } from "swooce";

/**
 * Module without any content.
 *
 * Useful for eg, an asset file. Useful when paired with {@link CopyModuleEmitter}.
 */
export class VoidModule extends Module {}

/**
 * Module with content.
 */
export abstract class ContentModule<TContent> extends Module {
  /**
   * Fetch the content of the src file of this module.
   */
  abstract fetch(ctx: Context): Promise<TContent>;
}

/**
 * Creates a module resolver which resolves modules via matching files for a module factory.
 *
 * # Example usage:
 *
 * ## Import all src/post/*.md pages from src/post.ts
 * ```ts
 * // src/site/page/post.ts
 * export default FactoryGlobModuleResolver(
 *   import.meta.url, // resolver file URL
 *     "*.md", // glob pattern to match all post markdowns
 *     (url) => new PostPageModule(url), // factory for each matched file
 *   );
 * ```
 *
 * @param resolverImportMetaURL `import.meta.url` of the resolver. ie, the `import.meta.url` from the esmodule that called this.
 */
export function FactoryGlobModuleResolver<T extends Module>(
  resolverImportMetaURL: string,
  pattern: string,
  moduleFactory: (moduleSrcFileURL: URL) => T,
) {
  return class extends ModuleResolver<T> {
    override async resolve(_ctx: any): Promise<T[]> {
      const resolverImportMetaDir = `${dirname(resolverImportMetaURL)}/`;

      const matches = await glob(pattern, {
        cwd: resolverImportMetaDir,
        nodir: true,
        posix: true,
        dotRelative: true,
      });

      // Map each match into a module using the factory
      return matches.map((relativePath) =>
        moduleFactory(new URL(relativePath, resolverImportMetaURL)),
      );
    }
  };
}

/**
 * Creates a module resolver which resolves modules via matching files as module resolvers.
 *
 * # Example usage:
 *
 * ## Import all .png and .svg images in sidecar dir
 * ```ts
 * // src/public/images.ts
 * export default sidecarDirBarrelModuleResolver(import.meta.url, "*.{png,svg});
 * ```
 *
 * @param resolverImportMetaURL `import.meta.url` of the resolver. ie, the `import.meta.url` from the esmodule that called this.
 */
export function MetaGlobModuleResolver(
  resolverImportMetaURL: string,
  pattern: string,
) {
  return class extends ModuleResolver<Module> {
    override async resolve(ctx: Context): Promise<Module[]> {
      const resolverImportMetaDir = `${dirname(resolverImportMetaURL)}/`;

      const matches = await glob(pattern, {
        cwd: resolverImportMetaDir,
        nodir: true,
        posix: true,
      });

      const modules: Module[] = [];

      for (const relativePath of matches) {
        const fileURL = new URL(relativePath, resolverImportMetaDir);

        // Dynamic import
        const imported = await import(fileURL.href);
        const ResolverClass =
          imported.default as new () => ModuleResolver<Module>;
        const resolverInstance = new ResolverClass();

        // Resolve and collect modules
        const resolved = await resolverInstance.resolve(ctx);
        if (Array.isArray(resolved)) {
          modules.push(...resolved);
        } else {
          modules.push(resolved);
        }
      }

      return modules;
    }
  };
}

/**
 * Base class for emitting content modules.
 * Handles fetch -> transform -> write.
 */
export abstract class ContentModuleEmitter<
  TContentModule extends ContentModule<TContnet>,
  TContnet = unknown,
> extends ModuleEmitter<TContentModule> {
  /**
   * Optionally transform the fetched content before writing.
   * Override this in subclasses to apply minification, bundling, etc.
   */
  async transform(
    _ctx: Context,
    content: TContnet,
    _module: TContentModule,
  ): Promise<TContnet> {
    return content; // default: no-op
  }

  /**
   * Writes the transformed content to disk at the resolved target URL.
   */
  protected abstract writeContent(
    ctx: Context,
    module: TContentModule,
    targetContent: TContnet,
  ): Promise<void>;

  /**
   * Emit a single module: fetch -> transform -> write
   */
  async emit(ctx: Context, module: TContentModule): Promise<void> {
    console.log(`ContentModuleEmitter will emit module ${module.srcFileURL}`);

    const srcContent = await module.fetch(ctx);
    const targetContent = await this.transform(ctx, srcContent, module);
    await this.writeContent(ctx, module, targetContent);

    console.log(`ContentModuleEmitter did emit module ${module.srcFileURL}`);
  }
}

/**
 * Module emitter which copies the module src file to its target file path.
 *
 * The target file path is resolved using {@link Context}.
 */
export class CopyModuleEmitter extends ModuleEmitter<Module> {
  async emit(ctx: Context, module: Module): Promise<void> {
    console.log(`CopyModuleEmitter will emit module ${module.srcFileURL}`);

    const targetFileURL = ctx.paths.resolveModuleTargetFileURL(ctx, module);

    await copyFile(module.srcFileURL, targetFileURL);

    console.log(
      `CopyModuleEmitter did emit module ${module.srcFileURL} -> ${targetFileURL}`,
    );
  }

  constructor() {
    super();
  }
}
