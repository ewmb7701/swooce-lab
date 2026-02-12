import { dirname as posixDirname } from "node:path/posix";
import { type ISite, type ISiteContext } from "swooce";
import { producer as indexPageProducer } from "./site/pages/index.ts";
import { producer as postPageProducer } from "./site/pages/post.ts";
import { producer as blogPageProducer } from "./site/pages/blog.ts";
import { producer as staticProducer } from "./site/static.ts";

interface ShowcaseSiteContext extends ISiteContext {}

function createSiteContext(packageJsonURL: URL): ShowcaseSiteContext {
  const projectDirURL = new URL(`${posixDirname(packageJsonURL.href)}/`);
  const srcDirURL = new URL("./src/", projectDirURL);
  const targetDirURL = new URL("./target/", projectDirURL);

  return {
    projectDirURL: projectDirURL,
    srcDirURL: srcDirURL,
    targetDirURL: targetDirURL,
  };
}

function createSite(): ISite {
  const artifactProducer = [
    indexPageProducer,
    blogPageProducer,
    postPageProducer,
    staticProducer,
  ];

  return {
    artifactProducer: artifactProducer,
  };
}

export { createSiteContext, createSite };
