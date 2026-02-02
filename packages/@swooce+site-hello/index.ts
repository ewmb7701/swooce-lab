/**
 * this source file contains `swooce` items for static site generation like Hello.
 *
 * This is a *lab*.
 *
 * ie, fileystem based routing.
 */

import { writeFile, mkdir } from "fs/promises";
import { relative } from "path/posix";
import { dirname } from "path";
import { fileURLToPath } from "url";
import type { Document } from "happy-dom";
import { ContentModule, Module, ModuleEmitter, type API } from "swooce";

function createHelloSiteAPI(projectDirURL: URL): API {
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./dist/", projectDirURL);

  return {
    paths: {
      /**
       * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `/posts/post-1.md.html`.
       */
      resolveModuleRoute: function (api: API, moduleSrcFileURL: URL): string {
        const moduleSrcFileRelativeURLPath = `/${relative(
          api.paths.srcDirURL.href,
          moduleSrcFileURL.href,
        )}`;

        if (moduleSrcFileRelativeURLPath.startsWith("/pages/")) {
          return `${moduleSrcFileRelativeURLPath.slice(6)}.html`;
        } else {
          throw new Error(`Not supported!`);
        }
      },
      /**
       * eg, `file:///home/eric/projects/my-cool-website/src/pages/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/pages/posts/post-1.md`.
       */
      resolveModuleTargetFileURL: function (api: API, module: Module): URL {
        const moduleRoute = this.resolveModuleRoute(api, module.srcFileURL);

        return new URL(`.${moduleRoute}`, `${api.paths.targetDirURL}`);
      },
      srcDirURL: srcDirURL,
      targetDirURL: targetDirURL,
    },
  } satisfies API;
}

class HelloSiteModule extends Module {
  /**
   * eg, pages, assets.
   */
  readonly pageModule: Array<ContentModule<Document>>;
  constructor(srcFileURL: URL, pageModule: Array<ContentModule<Document>>) {
    super(srcFileURL);
    this.pageModule = pageModule;
  }
}

class HelloSiteEmitter extends ModuleEmitter<HelloSiteModule> {
  /**
   * Emit module content to output directory.
   * The emitted files are the final build artifacts.
   */
  async emit(api: API, site: HelloSiteModule): Promise<void> {
    // we *could* use a ModuleEmitter for each page...
    for (const iPageModule of site.pageModule) {
      console.log(`emitting page '${iPageModule.srcFileURL}'`);

      const iPageModuleTargetFileURL = api.paths.resolveModuleTargetFileURL(
        api,
        iPageModule,
      );
      const iPageModuleTargetFilePath = dirname(
        fileURLToPath(iPageModuleTargetFileURL),
      );

      const iPageModuleSrcContent = await iPageModule.fetch(api);
      const iPageModuleSrcContentHTML =
        iPageModuleSrcContent.documentElement.outerHTML;

      // TODO transform

      await mkdir(iPageModuleTargetFilePath, {
        recursive: true,
      });
      await writeFile(
        iPageModuleTargetFileURL,
        iPageModuleSrcContentHTML,
        "utf-8",
      );

      console.log(
        `emitting page ${iPageModule.srcFileURL} -> ${iPageModuleTargetFileURL}`,
      );
    }
  }

  constructor() {
    super();
  }
}

export { HelloSiteModule, HelloSiteEmitter, createHelloSiteAPI };
