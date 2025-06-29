#!/usr/bin/env zsh

# このディレクトリが Git リポジトリか確認
if [[ ! -d .git ]]; then
  echo "エラー: このディレクトリは Git リポジトリではありません。" >&2
  exit 1
fi

# develop ブランチを最新状態へ更新
# 必要に応じて一時的に develop へチェックアウトします
current_branch=$(git symbolic-ref --short HEAD)
# リモート origin のデフォルトブランチを取得 (例: main, develop など)
default_branch=$(git remote show origin | awk '/HEAD branch/ {print $NF}')

# 取得できなかった場合は fallback として develop を使用
if [[ -z "$default_branch" ]]; then
  default_branch="develop"
fi

# ログ出力
echo "デフォルトブランチ: $default_branch"

if [[ "$current_branch" != "$default_branch" ]]; then
  echo "現在のブランチ: $current_branch → $default_branch にチェックアウトします。"
  git checkout "$default_branch" || {
    echo "$default_branch ブランチが存在しないため作成します。"
    git checkout -b "$default_branch" "origin/$default_branch" || git checkout -b "$default_branch"
  }
fi

echo "origin/develop をフェッチし、pull を実行します。"
git pull origin "$default_branch" 