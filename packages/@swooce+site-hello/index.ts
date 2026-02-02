/**
 * this source file contains `swooce` items for public site generation like Hello.
 *
 * This is a *lab*.
 *
 * ie, fileystem based routing.
 */

import { relative } from "path/posix";
import type { Document } from "happy-dom";
import { Module, ModuleEmitter, type Context } from "swooce";
import {
  CopyModuleEmitter,
  type ContentModule,
  type VoidModule,
} from "@swooce/core";
import { DocumentContentModuleEmitter } from "@swooce/happy-dom";

function createHelloSiteContext(projectDirURL: URL): Context {
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./target/", projectDirURL);

  return {
    paths: {
      /**
       * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `/posts/post-1.md.html`.
       */
      resolveModuleRoute: function (
        ctx: Context,
        moduleSrcFileURL: URL,
      ): string {
        const moduleSrcFileRelativeURLPath = `/${relative(
          ctx.paths.srcDirURL.href,
          moduleSrcFileURL.href,
        )}`;

        if (moduleSrcFileRelativeURLPath.startsWith("/site/pages/")) {
          return `${moduleSrcFileRelativeURLPath.slice(`/site/pages/`.length - 1)}.html`;
        } else if (moduleSrcFileRelativeURLPath.startsWith("/site/public/")) {
          return moduleSrcFileRelativeURLPath.slice("/site/public/".length - 1);
        } else {
          throw new Error(
            `Not supported! moduleSrcFileURL=${moduleSrcFileURL} moduleSrcFileRelativeURLPath=${moduleSrcFileRelativeURLPath}`,
          );
        }
      },
      /**
       * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/pages/posts/post-1.md`.
       */
      resolveModuleTargetFileURL: function (ctx: Context, module: Module): URL {
        const moduleRoute = this.resolveModuleRoute(ctx, module.srcFileURL);

        return new URL(`.${moduleRoute}`, `${ctx.paths.targetDirURL}`);
      },
      srcDirURL: srcDirURL,
      targetDirURL: targetDirURL,
    },
  } satisfies Context;
}

class HelloSiteModule extends Module {
  /**
   * Modules resolves from src/state/pages
   */
  readonly pageModule: Array<ContentModule<Document>>;
  readonly staticModule: Array<VoidModule>;

  constructor(
    srcFileURL: URL,
    pageModule: Array<ContentModule<Document>>,
    staticModule: Array<VoidModule>,
  ) {
    super(srcFileURL);
    this.pageModule = pageModule;
    this.staticModule = staticModule;
  }
}

class HelloSiteEmitter extends ModuleEmitter<HelloSiteModule> {
  /**
   * Emit module content to output directory.
   * The emitted files are the final build artifacts.
   */
  async emit(ctx: Context, site: HelloSiteModule): Promise<void> {
    const pageModuleEmitter = new DocumentContentModuleEmitter();
    for (const iPageModule of site.pageModule) {
      pageModuleEmitter.emit(ctx, iPageModule);
    }

    const staticModuleEmitter = new CopyModuleEmitter();
    for (const iStaticModule of site.staticModule) {
      staticModuleEmitter.emit(ctx, iStaticModule);
    }
  }

  constructor() {
    super();
  }
}

export { HelloSiteModule, HelloSiteEmitter, createHelloSiteContext };
