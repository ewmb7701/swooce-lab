import { mkdir, rm } from "fs/promises";
import { HelloSiteEmitter, createHelloSiteContext } from "@swooce/site-hello";

import MySiteArtifactResolver from "../src/site.ts";

const ctx = createHelloSiteContext(new URL("../", import.meta.url));

// create site
const mySiteArtifactResolver = new MySiteArtifactResolver();
const mySiteArtifact = await mySiteArtifactResolver.resolve(ctx);

await rm(ctx.paths.targetDirURL, { recursive: true, force: true });
await mkdir(ctx.paths.targetDirURL, { recursive: true });

// generate site
const helloSiteEmitter = new HelloSiteEmitter();
await helloSiteEmitter.emit(ctx, mySiteArtifact);
