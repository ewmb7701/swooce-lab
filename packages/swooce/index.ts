/**
 * Base artifact type.
 */
abstract class Artifact {
  /**
   * Absolute URL of the source file of this artifact.
   *
   * eg,`/home/eric/projects/my-cool-website/src/document/posts/reasons-im-cool.md`
   */
  readonly srcFileURL: URL;

  constructor(srcFileURL: URL) {
    this.srcFileURL = srcFileURL;
  }
}

interface PipelineContextPaths {
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
   * Resolve the route of an artifact using the artifact src file URL.
   */
  resolveArtifactRoute: (
    ctx: PipelineContext,
    artifactSrcFileURL: URL,
  ) => string;

  /**
   * Resolve the absolute target URL of an artifact.
   *
   * eg, resolves `file:///home/eric/projects/my-cool-website/src/document/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/document/posts/post-1.md`.
   */
  resolveArtifactTargetFileURL: (
    ctx: PipelineContext,
    artifact: Artifact,
  ) => URL;
}

/**
 * Site-wide pipelinecontext shared between all artifacts, like project paths and resolvers.
 *
 * Provided to all primitives.
 */
interface PipelineContext {
  readonly paths: PipelineContextPaths;
}

abstract class ArtifactEmitter<TArtifact extends Artifact> {
  /**
   * Emit site files to target directory.
   * The emitted public site files are the final build artifacts.
   */
  abstract emit(ctx: PipelineContext, artifact: TArtifact): Promise<void>;
}

abstract class ArtifactResolver<TArtifact extends Artifact> {
  /**
   * Returns an array.
   */
  abstract resolve(ctx: PipelineContext): Promise<TArtifact | Array<TArtifact>>;
}

export {
  Artifact,
  ArtifactResolver,
  ArtifactEmitter,
  type PipelineContext,
  type PipelineContextPaths,
};
