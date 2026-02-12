# @swooce/framework-astro

Swooce primitives for building an Astro-like website.

# Pipeline behavior

The pipeline,

## Pages

- finds `src/pages/*.ts` as `DocumentContentArtifact`
- finds routes of artifacts in `src/pages/*.ts` as relative paths wrt to `src/pages/`
- writes artifacts in `src/pages/*.ts` to `dist/*.html`

## Assets

- finds `public/*` as `Artifact`
- finds routes of artifacts in `public/*` as reslative paths wrt `public/`
- writes artifacts in `public/` to `dist/` via filesystem copy
