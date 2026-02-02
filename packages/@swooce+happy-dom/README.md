# @swooce/core

Core `swooce` primitives for producing a website.

# Concepts

## Sidecar

A "sidecar" is a file or directory adjacent to a file with a ESM source file. eg, `src/public/images.ts` is the sidecar file for the `src/public/images/` directory. eg, `src/public/clock-drawing.png.ts` is the sidecar file for the `src/public/images/clock-drawing.png` file.

You are strongly encouraged to create sidecars for your artifact resolvers! It's useful to
