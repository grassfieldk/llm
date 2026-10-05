# LLM

LLM を活用するためのリソース集


## リソース

- `prompts/`: 各モデルのシステムプロンプト
- `custom/agents.md`: 共通のカスタム指示
- `skills/`: 再利用できるスキル


## カスタム指示とスキルの同期

次のコマンドで、カスタム指示とスキルを Codex、Claude Code、GitHub Copilot のユーザー設定へ同期します。

```sh
bun run sync
```

WSL で実行すると、WSL と Windows のユーザー設定を同期します。同期先は次のとおりです。

| ツール         | カスタム指示                         | スキル               |
| -------------- | ------------------------------------ | -------------------- |
| Codex          | `~/.codex/AGENTS.md`                 | `~/.codex/skills/`   |
| Claude Code    | `~/.claude/CLAUDE.md`                | `~/.claude/skills/`  |
| GitHub Copilot | `~/.copilot/copilot-instructions.md` | `~/.copilot/skills/` |

既存のカスタム指示ファイルと、同期元にあるスキル内のファイルは上書きされます。
同期元から削除したファイルは同期先に残ります。

ChatGPT Desktop と Claude Desktop のアカウント単位のカスタム指示は、このコマンドでは更新できません。
各アプリの設定画面で反映してください。
