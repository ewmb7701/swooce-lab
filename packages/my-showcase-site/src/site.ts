import { mkdir, writeFile } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
import type { Document } from "happy-dom";
import { type ISite, type ISiteContext } from "swooce";
import {
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  emitArtifactSrcFileViaCopy,
  SrcFileArtifact,
  type IArtifactWithSrcContent,
} from "@swooce/core";

type ShowcasePagesArtifact = SrcFileArtifact &
  IArtifactWithSrcContent<Document>;
type ShowcaseStaticArtifact = SrcFileArtifact;
type ShowcaseArtifact = ShowcasePagesArtifact | ShowcaseStaticArtifact;

async function resolvePagesArtifact(siteContext: ShowcaseSiteContext) {
  const resolveDynamicGlobArtifact =
    createDynamicGlobArtifactResolver<ShowcasePagesArtifact>(
      "./src/pages/**/*.ts",
      (siteContext) => siteContext.projectDirURL,
    );

  const pagesArtifact = await resolveDynamicGlobArtifact(siteContext);

  return pagesArtifact;
}

const resolveStaticArtifact =
  createFactoryGlobArtifactResolver<ShowcaseStaticArtifact>(
    "./src/static/**",
    (siteContext) => siteContext.projectDirURL,
    (siteContext, srcFileURL) =>
      new SrcFileArtifact(
        siteContext.getArtifactRouteUsingSrcFileURL(srcFileURL),
        srcFileURL,
      ),
  );

async function emitShowcasePagesArtifact(
  siteContext: ShowcaseSiteContext,
  artifact: ShowcasePagesArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await artifact.fetchSrcContent(siteContext);

  // TODO transform

  const targetContent = srcContent;
  const targetFileURL = siteContext.getArtifactTargetFileURL(artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${dirname(targetFilePath)}${sep}`;

  await mkdir(targetDir, { recursive: true });
  await writeFile(
    targetFileURL,
    targetContent.documentElement.outerHTML,
    "utf-8",
  );
}

interface ShowcaseSiteContext extends ISiteContext {}

function createSiteContext(packageJsonURL: URL): ShowcaseSiteContext {
  const projectDirURL = new URL(`${dirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./target/", projectDirURL);

  return {
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
    getArtifactRouteUsingSrcFileURL(artifactSrcFileURL: URL): string {
      // get relative path of artifact wrt to project dir
      const artifactSrcFileRelativeURLPath = `/${posixRelative(
        projectDirURL.href,
        artifactSrcFileURL.href,
      )}`;

      if (artifactSrcFileRelativeURLPath.startsWith("/src/pages/")) {
        return `${artifactSrcFileRelativeURLPath.slice(`/src/pages/`.length - 1)}.html`;
      } else if (artifactSrcFileRelativeURLPath.startsWith("/src/static/")) {
        return artifactSrcFileRelativeURLPath.slice("/src/static/".length - 1);
      } else {
        throw new Error(
          `Not supported! artifactSrcFileURL=${artifactSrcFileURL} artifactSrcFileRelativeURLPath=${artifactSrcFileRelativeURLPath}`,
        );
      }
    },
    getArtifactTargetFileURL: function (artifact): URL {
      const artifactRoute = artifact.route;

      return new URL(`.${artifactRoute}`, `${this.targetDirURL}`);
    },
  };
}

function createSite(): ISite {
  const artifactProducer = [
    {
      resolve: resolvePagesArtifact,
      emit: emitShowcasePagesArtifact,
    },
    {
      resolve: resolveStaticArtifact,
      emit: emitArtifactSrcFileViaCopy,
    },
  ];

  return {
    artifactProducer: artifactProducer,
  };
}

export {
  createSiteContext,
  createSite,
  type ShowcaseArtifact,
  type ShowcaseSiteContext,
};
