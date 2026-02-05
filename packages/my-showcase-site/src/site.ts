import type { Writable } from "node:stream";
import { dirname } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import type { Document } from "happy-dom";
import { type ISite, type ISiteContext } from "swooce";
import {
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  SrcFileArtifact,
  type IArtifactWithSrcContent,
  writeArtifactViaCopy,
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

async function writeShowcasePagesArtifact(
  siteContext: ShowcaseSiteContext,
  artifact: ShowcasePagesArtifact,
  writable: Writable,
): Promise<void> {
  const srcContent = await artifact.fetchSrcContent(siteContext);
  const targetContent = srcContent.documentElement.outerHTML;
  writable.write(targetContent);
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
  };
}

function createSite(): ISite {
  const artifactProducer = [
    {
      resolve: resolvePagesArtifact,
      write: writeShowcasePagesArtifact,
    },
    {
      resolve: resolveStaticArtifact,
      write: writeArtifactViaCopy,
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
