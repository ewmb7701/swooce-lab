import { mkdir, rm } from "fs/promises";
import { API, APIPaths } from "#swooce";
import { staticSiteResolvers, StaticSiteEmitter } from "#@swooce/standard";

import MySiteFactory from "../src/site.ts";

// determine project paths
const FOO_TARGET_DIR_PATH = "../dist/";
const fooSiteSrcDirURL = new URL("../src/", import.meta.url);
const fooSiteDocumentSrcDirURL = new URL("../src/document/", import.meta.url);
const fooSiteTargetDirAbsoluteUrl = new URL(
  FOO_TARGET_DIR_PATH,
  import.meta.url,
);
const apiPaths = {
  siteSrcDirURL: fooSiteSrcDirURL,
  documentSrcDirURL: fooSiteDocumentSrcDirURL,
  documentTargetDirURL: fooSiteTargetDirAbsoluteUrl,
} satisfies APIPaths;
const apiResolvers = staticSiteResolvers;
const api: API = {
  resolvers: apiResolvers,
  paths: apiPaths,
};

// create site
const mySiteFactory = new MySiteFactory();
const mySiteSrc = await mySiteFactory.create(api);

// ensure clean generation target directory
await rm(fooSiteTargetDirAbsoluteUrl, { recursive: true });
await mkdir(fooSiteTargetDirAbsoluteUrl);

// generate site (emit static site files with client-side hydration to target directory)
const staticSiteEmitter = new StaticSiteEmitter();
await staticSiteEmitter.emit(api, mySiteSrc);
