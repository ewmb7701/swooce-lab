# @swooce/framework-astro

Swooce primitives for building an Astro-like website.

# Pipeline behavior

The pipeline,

## Pages

- resolves `src/pages/*.ts` as `DocumentContentArtifact`
- resolves routes of artifacts in `src/pages/*.ts` as relative paths wrt to `src/pages/`
- emits artifacts in `src/pages/*.ts` to `dist/*.html`

## Assets

- resolves `public/*` as `Artifact`
- resolves routes of artifacts in `public/*` as reslative paths wrt `public/`
- emits artifacts in `public/` to `dist/` via filesystem copy
