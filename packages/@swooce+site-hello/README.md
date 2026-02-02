# @swooce/site-hello

Swooce primitives for building a "hello" website.

"hello" as in "Hello, world!"

# Usage

The pipeline,

- `ContentModule<Document>` in "/src/site/pages/\*" will be emit to "/target/\*.html" building.
- `VoidModule` in "/src/site/public"` will be emit to "/target/public/\*" via copy.
