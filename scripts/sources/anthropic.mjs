import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch({ headless: true });

for (const language of ["en", "ja"]) {
  const url = `https://platform.claude.com/docs/${language}/release-notes/system-prompts`;
  const output = `prompts/anthropic/${language}`;
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  const article = page.locator("#content-container");
  await article.evaluate((article) => {
    for (const button of article.querySelectorAll('button[aria-expanded="false"]')) button.click();
  });
  const models = await article.evaluate((article) => Array.from(article.querySelectorAll("a[href]"))
    .map((link) => ({
      name: link.textContent.match(/Claude (?:Opus|Sonnet|Haiku|Fable) [0-9.]+/)?.[0] || "",
      url: link.href,
    }))
    .filter(({ name, url }) => name && new URL(url).pathname.includes("/release-notes/system-prompts/")));
  if (!models.length) {
    await page.close();
    throw new Error(`${language} のモデル一覧を取得できませんでした`);
  }

  for (const { name, url: modelUrl } of models) {
    await page.goto(modelUrl, { waitUntil: "networkidle" });
    const modelArticle = page.locator("#content-container");
    await modelArticle.evaluate((article) => {
      for (const button of article.querySelectorAll('button[aria-expanded="false"]')) button.click();
      article.querySelector("h1")?.remove();
    });
    const text = (await modelArticle.innerText()).trim();
    if (!text) throw new Error(`${language} の ${name} のプロンプトを取得できませんでした`);
    const slug = name.toLowerCase().replaceAll(" ", "-") + ".md";
    const body = `---\nprovider: Anthropic\nmodel: ${name}\nlanguage: ${language}\nsource: ${modelUrl}\n---\n\n${text}\n`;
    await mkdir(output, { recursive: true });
    await writeFile(`${output}/${slug}`, body);
    console.log(`${language}: ${name} -> ${output}/${slug}`);
  }
  await page.close();
}

await browser.close();
