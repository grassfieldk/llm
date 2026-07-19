import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const url = "https://platform.claude.com/docs/en/release-notes/system-prompts";
const output = "prompts/anthropic";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle" });

await page.locator("#content-container").evaluate((article) => {
  for (const button of article.querySelectorAll('button[aria-expanded="false"]')) button.click();
});
await page.waitForTimeout(2500);
const models = await page.locator("h2").evaluateAll((headings) => headings.map((heading) => {
  const name = heading.textContent.match(/Claude (?:Opus|Sonnet|Haiku|Fable) [0-9.]+/)?.[0] || "";
  if (!name) return null;
  const parts = [];
  let sibling = heading.nextElementSibling;
  while (sibling && sibling.tagName !== "H2") { parts.push(sibling.innerText); sibling = sibling.nextElementSibling; }
  return { name, text: parts.join("\n\n").trim() };
}).filter(Boolean));

await browser.close();
if (!models.length) throw new Error("モデルを取得できませんでした");

for (const { name, text } of models) {
  const slug = name.toLowerCase().replaceAll(" ", "-") + ".md";
  const body = `---\nprovider: Anthropic\nmodel: ${name}\nsource: ${url}\n---\n\n${text}\n`;
  await mkdir(output, { recursive: true });
  await writeFile(`${output}/${slug}`, body);
  console.log(`${name} -> ${output}/${slug}`);
}
