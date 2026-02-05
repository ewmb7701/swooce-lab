import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
import type { Document } from "happy-dom";
import { type PipelineContext } from "swooce";
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

async function resolvePagesArtifact(ctx: ShowcasePipelineContext) {
  const resolveDynamicGlobArtifact =
    createDynamicGlobArtifactResolver<ShowcasePagesArtifact>(
      "./src/site/pages/**/*.ts",
      (ctx) => ctx.projectDirURL,
    );

  const pagesArtifact = await resolveDynamicGlobArtifact(ctx);

  return pagesArtifact;
}

const resolveStaticArtifact =
  createFactoryGlobArtifactResolver<ShowcaseStaticArtifact>(
    "./src/site/static/**",
    (ctx) => ctx.projectDirURL,
    (ctx, srcFileURL) =>
      new SrcFileArtifact(
        ctx.getArtifactRouteUsingSrcFileURL(srcFileURL),
        srcFileURL,
      ),
  );

async function emitShowcasePagesArtifact(
  ctx: ShowcasePipelineContext,
  artifact: ShowcasePagesArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await artifact.fetchSrcContent(ctx);

  // TODO transform

  const targetContent = srcContent;
  const targetFileURL = ctx.getArtifactTargetFileURL(artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${dirname(targetFilePath)}${sep}`;

  await mkdir(targetDir, { recursive: true });
  await writeFile(
    targetFileURL,
    targetContent.documentElement.outerHTML,
    "utf-8",
  );
}

interface ShowcasePipelineContext extends PipelineContext {}

function createShowcasePipelineContext(
  packageJsonURL: URL,
): ShowcasePipelineContext {
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

      if (artifactSrcFileRelativeURLPath.startsWith("/src/site/pages/")) {
        return `${artifactSrcFileRelativeURLPath.slice(`/src/site/pages/`.length - 1)}.html`;
      } else if (
        artifactSrcFileRelativeURLPath.startsWith("/src/site/static/")
      ) {
        return artifactSrcFileRelativeURLPath.slice(
          "/src/site/static/".length - 1,
        );
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

async function runShowcasePipeline(ctx: ShowcasePipelineContext) {
  await rm(ctx.targetDirURL, { recursive: true, force: true });
  await mkdir(ctx.targetDirURL, { recursive: true });

  const modulePagesArtifact = await resolvePagesArtifact(ctx);
  for (const iModulePageArtifact of modulePagesArtifact) {
    emitShowcasePagesArtifact(ctx, iModulePageArtifact);
  }

  const staticArtifact = await resolveStaticArtifact(ctx);
  for (const iStaticArtifact of staticArtifact) {
    emitArtifactSrcFileViaCopy(ctx, iStaticArtifact);
  }
}

export {
  createShowcasePipelineContext,
  runShowcasePipeline,
  type ShowcasePipelineContext,
};
