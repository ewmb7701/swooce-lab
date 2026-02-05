import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, sep } from "node:path";
import { relative as posixRelative } from "node:path/posix";
import { fileURLToPath } from "node:url";
import type { Document } from "happy-dom";
import { Artifact, type PipelineContext } from "swooce";
import {
  createDynamicGlobArtifactResolver,
  createFactoryGlobArtifactResolver,
  emitFileArtifactViaCopy,
  type IArtifactWithSrcFileContent,
} from "@swooce/core";

type ShowcasePagesArtifact = Artifact & IArtifactWithSrcFileContent<Document>;
type ShowcaseStaticArtifact = Artifact;
type ShowcaseArtifact = ShowcasePagesArtifact | ShowcaseStaticArtifact;

async function resolvePagesArtifact(ctx: ShowcasePipelineContext) {
  const resolveDynamicGlobArtifact = createDynamicGlobArtifactResolver(
    ctx.projectDirURL,
    "./src/site/pages/**/*.ts",
  );

  const pagesArtifact = (await resolveDynamicGlobArtifact(ctx)) as Array<
    Artifact & IArtifactWithSrcFileContent<Document>
  >;

  return pagesArtifact;
}

async function resolveStaticArtifact(ctx: ShowcasePipelineContext) {
  const resolveDynamicGlobArtifact = createFactoryGlobArtifactResolver(
    ctx.projectDirURL,
    "./src/site/static/**",
    (srcFileURL) => new Artifact(srcFileURL),
  );

  const staticArtifact = (await resolveDynamicGlobArtifact(ctx)) as Array<
    Artifact & IArtifactWithSrcFileContent<Document>
  >;

  return staticArtifact;
}
async function emitShowcasePagesArtifact(
  ctx: ShowcasePipelineContext,
  artifact: ShowcaseArtifact,
): Promise<void> {
  // TODO type guard
  const srcContent = await (
    artifact as ShowcasePagesArtifact
  ).fetchSrcFileContent(ctx);

  // TODO transform

  const targetContent = srcContent;
  const targetFileURL = ctx.getArtifactTargetFileURL(ctx, artifact);
  const targetFilePath = fileURLToPath(targetFileURL);
  const targetDir = `${dirname(targetFilePath)}${sep}`;

  await mkdir(targetDir, { recursive: true });
  await writeFile(
    targetFileURL,
    targetContent.documentElement.outerHTML,
    "utf-8",
  );
}

interface ShowcasePipelineContext extends PipelineContext<ShowcaseArtifact> {}

function createShowcasePipelineContext(
  packageJsonURL: URL,
): ShowcasePipelineContext {
  const projectDirURL = new URL(`${dirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./target/", projectDirURL);

  return {
    getArtifactRoute: function (
      ctx: ShowcasePipelineContext,
      artifactSrcFileURL: URL,
    ): string {
      // get relative path of artifact wrt to project dir
      const artifactSrcFileRelativeURLPath = `/${posixRelative(
        ctx.projectDirURL.href,
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
    getArtifactTargetFileURL: function (
      ctx: ShowcasePipelineContext,
      artifact: Artifact,
    ): URL {
      const artifactRoute = this.getArtifactRoute(ctx, artifact.srcFileURL);

      return new URL(`.${artifactRoute}`, `${ctx.targetDirURL}`);
    },
    getArtifactEmitter(ctx, artifact) {
      const artifactRoute = ctx.getArtifactRoute(ctx, artifact.srcFileURL);

      if (artifactRoute.endsWith(".ts.html")) {
        return emitShowcasePagesArtifact;
      }

      // fallback to copy
      return emitFileArtifactViaCopy;
    },
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  };
}

async function runShowcasePipeline(ctx: ShowcasePipelineContext) {
  await rm(ctx.targetDirURL, { recursive: true, force: true });
  await mkdir(ctx.targetDirURL, { recursive: true });

  const pageArtifact = await resolvePagesArtifact(ctx);
  const staticArtifact = await resolveStaticArtifact(ctx);

  const siteArtifact = [...pageArtifact, ...staticArtifact];

  for (const iArtifact of siteArtifact) {
    const emitArtifact = ctx.getArtifactEmitter(ctx, iArtifact);
    await emitArtifact(ctx, iArtifact);
  }
}

export {
  createShowcasePipelineContext,
  runShowcasePipeline,
  type ShowcasePipelineContext,
};
