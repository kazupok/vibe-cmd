gh issue view #$ARGUMENTS でGitHubのIssueの内容を確認し、タスクの遂行を行なってください。
タスクは以下の手順で進めてください。

1. Issueに記載されている内容を理解する
2. developにチェックアウトし、pullを行い、最新のリモートの状態を取得する
3. 必ずIssueの内容を元に、適切な命名でブランチを作成、チェックアウトする
4. Issueの内容を実現するために必要なタスクを実行する
5. 適切なテストを追加する
6. タスクの終了後に必ず`pnpm test`, `pnpm build`, `pnpm check-types`,`pnpm lint` を実行し、すべてのテストが通ることを確認する
7. コミットを適切な粒度で作成する
8. PRを作成する。なお、PRのdescriptionには`Closes #$ARGUMENTS`と冒頭に記載すること
