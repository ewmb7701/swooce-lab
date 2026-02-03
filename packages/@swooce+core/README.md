# @swooce/core

Core `swooce` primitives for producing a website.

# Patterns

```typescript
// src/site/pages.ts

import { DyamicGlobArtifactResolver } from "@swooce/core";

// we resolve artifacts via dynamic import of ES modules with a default export of artifact resolvers
export default DyamicGlobArtifactResolver(import.meta.url, "./pages/*.ts");
```

## Artifact resolver as default export

`@swooce` packages _requires_ your artifact resolver to be the `default` `export` when dealing with ES modules.

This enables some very powerful patterns:

## Sidecar ES module file

A "sidecar" is a file or directory adjacent to a file with an ES module. eg, `src/public/images.ts` is the sidecar file for the `src/public/images/` directory. eg, `src/public/clock-drawing.png.ts` is the sidecar file for the `src/public/images/clock-drawing.png` file.

You are _strongly encouraged_ to use the sidecar pattern for your artifact resolvers.
