# @swooce/site-hello

Swooce primitives for building a "hello" website.

"hello" as in "Hello, world!"

# Usage

The pipeline,

- `ContentArtifact<Document>` in "/src/site/pages/\*" will be emit to "/target/\*.html" building.
- `VoidArtifact` in "/src/site/public"` will be emit to "/target/public/\*" via filesystem copy.
