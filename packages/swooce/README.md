# swooce

> Watch me _swooce_ right in!

# Overview

`swooce` is a low-level library of primitives for composing build pipelines for web projects.

It provides unopinionated abstractions for resolving artifacts, constructing module graphs, and writeting output.

# Usage

Concrete build behavior is defined entirely by pipelines built on top of `swooce`.

The `swooce` package itself does not provide a default pipeline.

As an end user, you can:

- Import an existing framework (eg `@swooce/framework-astro`)
- Implement your own build script and pipeline

# Concepts

## Artifact

A first-class unit of work in a build pipeline.

Artifacts are always backed by a concrete source file on disk; There are no virtual or synthetic artifacts by design.

Examples include:

- A `my-custom-site/IndexPageArtifact` for `src/site/pages/index.ts`
- A `@swooce/core/Artifact` for `src/site/assets/images/clock-drawing.png`

## ArtifactWriter

Responsible for writeting the output representation of an artifact into a target directory.

## ArtifactResolver

An **ArtifactResolver** is responsible for discovering artifacts and constructing the artifact graph.

Resolvers operate exclusively on the filesystem. They locate concrete source files (typically via glob patterns or directory conventions) and return the corresponding artifacts. Resolvers never synthesize "virtual" artifacts.

Key properties of resolvers in swooce:

- **File-backed only**: every resolved artifact corresponds to a real file on disk
- **Pure discovery**: resolvers do not write output or perform transformations
- **Composable**: resolvers may delegate to or invoke other resolvers
- **Explicit**: resolution order and structure are defined by the pipeline, not inferred implicitly

Resolvers may return:

- a single artifact
- multiple artifacts
- or no artifacts

This allows pipelines to model both one-to-one and one-to-many resolution patterns (eg a single index file resolving many page artifacts).

### Examples

- Resolving all pages in `src/site/pages/*.ts`
- Resolving all static assets in `src/site/assets/**`
- Resolving a directory of markdown files into multiple document artifacts
- Resolving resolver modules dynamically (meta-resolution)

Resolvers are executed as part of a pipeline and are fully controlled by pipeline policy. Different pipelines may resolve the same project layout in entirely different ways.

## Pipeline

Pipelines define opinionated build behavior built on top of `swooce` core.

A pipeline defines:

- Execution order: the sequence in which resolvers and writers are invoked
- Selection of resolvers and writers to run
- Coordination of artifact flow from resolvers to writers

Pipelines orchestrate resolvers and writers but do not define _how_ artifacts are resolved or writeted; those policies are defined in the `SiteContext`.

This `swooce` package itself does not provide a pipeline.

## SiteContext

The `SiteContext` provides shared, read-only policy and coordination data for a pipeline run.

It represents the execution environment in which resolvers and writers operate. Rather than hard-coding assumptions about project layout, routing, or emission behavior, `swooce` passes this information explicitly via the `SiteContext`.

Resolvers and writers receive the `SiteContext` as an explicit parameter and must not rely on global state.

The `SiteContext` is created by the build script and is immutable for the duration of the run.

### Responsibilities

A pipeline context:

- defines routing policy (eg, filesystem-based routing rules)
- defines emission policy (eg, how routes map to output file URLs)
- provides shared utilities required for module coordination

### Non-Responsibilities

A pipeline context does **not**:

- perform resolution
- write artifacts
- own lifecycle or execution order
- contain mutable build state

It is a policy container, not a controller.

### Why SiteContext Exists

Pipelines in `swooce` are opinionated by design. The `SiteContext` is how those opinions are expressed and enforced.

Different pipelines may define radically different `SiteContexts`, even for the same project:

- a static-site pipeline
- a documentation pipeline
- an asset-only pipeline

By making pipeline policy explicit and injectable, `swooce` avoids implicit global behavior and keeps module resolution and emission deterministic and inspectable.

## Build Scripts

A build script is framework-owned or user-owned script that initiates a build.

Build scripts are the entry point of a `swooce` build. They define when and how pipelines are executed, but not what those pipelines do.

It is responsible for:

- Creating the `SiteContext`
- Selecting one or more pipelines to run
- Running the pipelines

This `swooce` package itself does not provide a build script.

## Frameworks

A framework is a distribution layer built on top of `swooce`.

Framework packages (eg `@swooce/framework-astro`) provide ergonomics to the end user:

- One or more pipelines
- A `SiteContext` constructor
- Conventional project layout and defaults

This `swooce` package itself does not provide a framework.
