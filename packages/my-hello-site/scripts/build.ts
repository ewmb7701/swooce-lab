import { mkdir, rm } from "fs/promises";
import { HelloSiteEmitter, createHelloSiteContext } from "@swooce/site-hello";

import MySiteModuleResolver from "../src/site.ts";

const ctx = createHelloSiteContext(new URL("../", import.meta.url));

// create site
const mySiteModuleResolver = new MySiteModuleResolver();
const mySiteModule = await mySiteModuleResolver.resolve(ctx);

await rm(ctx.paths.targetDirURL, { recursive: true, force: true });
await mkdir(ctx.paths.targetDirURL, { recursive: true });

// generate site
const helloSiteEmitter = new HelloSiteEmitter();
await helloSiteEmitter.emit(ctx, mySiteModule);
