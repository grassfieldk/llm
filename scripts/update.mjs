const sources = {
  anthropic: "./sources/anthropic.mjs",
};

const requested = process.argv.slice(2);
const targets = requested.length ? requested : Object.keys(sources);

for (const source of targets) {
  const modulePath = sources[source];
  if (!modulePath) throw new Error(`未対応のソースです: ${source}`);
  await import(modulePath);
}
