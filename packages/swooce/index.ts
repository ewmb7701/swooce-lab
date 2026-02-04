class Artifact {
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

/**
 * Site-wide context shared between all primitives, like project paths and resolvers.
 *
 * Provided to all primitives.
 */
interface PipelineContext {
  /**
   * The absolute URL of the site project directory.
   *
   * eg, "file:///home/eric/projects/my-cool-website/"
   */
  readonly projectDirURL: URL;

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
   * Get the route of an artifact using the artifact src file URL.
   */
  getArtifactRoute: (ctx: this, artifactSrcFileURL: URL) => string;

  /**
   * Get the absolute target URL of an artifact.
   *
   * eg, from `file:///home/eric/projects/my-cool-website/src/document/posts/post-1.md` to `file:///home/eric/projects/my-cool-website/target/document/posts/post-1.md`.
   */
  getArtifactTargetFileURL: (ctx: this, artifact: Artifact) => URL;

  getArtifactEmitter: (ctx: this, artifact: Artifact) => ArtifactEmitter;
}

abstract class ArtifactEmitter<TArtifact extends Artifact = Artifact> {
  /**
   * Emit site files to target directory.
   * The emitted public site files are the final build artifacts.
   */
  abstract emit(ctx: PipelineContext, artifact: TArtifact): Promise<void>;
}

abstract class ArtifactResolver<TArtifact extends Artifact = Artifact> {
  /**
   * Returns an array.
   */
  abstract resolve(ctx: PipelineContext): Promise<TArtifact | Array<TArtifact>>;
}

abstract class Pipeline<TPipelineContext extends PipelineContext> {
  abstract run(ctx: TPipelineContext): Promise<void>;
}

export {
  Artifact,
  ArtifactResolver,
  ArtifactEmitter,
  Pipeline,
  type PipelineContext,
};
