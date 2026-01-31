import { pathToFileURL } from "url";
import { sep } from "path";
import { mkdir, rm } from "fs/promises";
import { SiteGenerator } from "#swooce";

import MySiteFactory from "../src/site/index.ts";

// determine project paths
const MY_SITE_GENERATOR_OUT_DIR_PATH = "./dist/";
const myProjectRootDirFileUrl = pathToFileURL(process.cwd() + sep);
const myProjectOutDirFileUrl = new URL(
  MY_SITE_GENERATOR_OUT_DIR_PATH,
  myProjectRootDirFileUrl,
);

// create site
const mySiteFactory = new MySiteFactory();
const mySite = mySiteFactory.create();

// ensure clean generation output directory
await rm(myProjectOutDirFileUrl, { recursive: true });
await mkdir(myProjectOutDirFileUrl);

// generate site (emit static site files with client-side hydration to output directory)
const mySiteGenerator = new SiteGenerator(mySite, myProjectOutDirFileUrl);
await mySiteGenerator.generate();
