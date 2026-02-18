import { $ } from "bun";

console.log("Building digi CLI...");

await $`bun build src/index.ts --compile --outfile dist/digi`;

console.log("Built: dist/digi");
