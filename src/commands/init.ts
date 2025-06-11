import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  CONFIG_FILE_NAME, 
  CLAUDE_MD_FILE_NAME, 
  CURSOR_RULES_DIR, 
  CURSOR_RULES_FILE, 
  VIBE_CMD_DIR, 
  MESSAGES, 
  VCMD_COMMAND_INSTRUCTION, 
  CLAUDE_MD_TEMPLATE, 
  CURSOR_RULES_TEMPLATE 
} from '../constants/index.js';
import { logSuccess, logWarning, logCelebration, logGray } from '../utils/console.js';
import { handleError } from '../utils/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

function copyDirectory(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src);
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export async function handleInitCommand(): Promise<void> {
  try {
    const currentDir = process.cwd();
    const configSource = join(projectRoot, CONFIG_FILE_NAME);
    const vibeCmdDirSource = join(projectRoot, VIBE_CMD_DIR);

    const configDest = join(currentDir, CONFIG_FILE_NAME);
    const vibeCmdDirDest = join(currentDir, VIBE_CMD_DIR);

    // vibe-cmd.config.json をコピー
    if (existsSync(configSource)) {
      copyFileSync(configSource, configDest);
      logSuccess(MESSAGES.SUCCESS.CONFIG_COPIED);
    } else {
      logWarning(MESSAGES.WARNING.CONFIG_NOT_FOUND_IN_SOURCE);
    }

    // .vibe-cmd ディレクトリをコピー
    if (existsSync(vibeCmdDirSource)) {
      copyDirectory(vibeCmdDirSource, vibeCmdDirDest);
      logSuccess(MESSAGES.SUCCESS.DIR_COPIED);
    } else {
      logWarning(MESSAGES.WARNING.DIR_NOT_FOUND_IN_SOURCE);
    }

    // CLAUDE.md の処理
    const claudeMdPath = join(currentDir, CLAUDE_MD_FILE_NAME);

    if (existsSync(claudeMdPath)) {
      const existingContent = readFileSync(claudeMdPath, 'utf-8');
      
      // 既に同じ内容が含まれているかチェック
      if (!existingContent.includes('npx vcmd cmd')) {
        const updatedContent = existingContent + VCMD_COMMAND_INSTRUCTION;
        writeFileSync(claudeMdPath, updatedContent, 'utf-8');
        logSuccess(MESSAGES.SUCCESS.CLAUDE_MD_UPDATED);
      } else {
        logWarning(MESSAGES.WARNING.CLAUDE_MD_ALREADY_EXISTS);
      }
    } else {
      const newContent = CLAUDE_MD_TEMPLATE(VCMD_COMMAND_INSTRUCTION);
      
      writeFileSync(claudeMdPath, newContent, 'utf-8');
      logSuccess(MESSAGES.SUCCESS.CLAUDE_MD_CREATED);
    }

    // .cursor/rules/vibe-cmd.mdc の処理
    const cursorRulesDir = join(currentDir, CURSOR_RULES_DIR);
    const cursorVibeCmdPath = join(cursorRulesDir, CURSOR_RULES_FILE);
    
    if (!existsSync(cursorRulesDir)) {
      mkdirSync(cursorRulesDir, { recursive: true });
    }

    if (existsSync(cursorVibeCmdPath)) {
      const existingContent = readFileSync(cursorVibeCmdPath, 'utf-8');
      
      // 既に同じ内容が含まれているかチェック
      if (!existingContent.includes('npx vcmd cmd')) {
        const updatedContent = existingContent + VCMD_COMMAND_INSTRUCTION;
        writeFileSync(cursorVibeCmdPath, updatedContent, 'utf-8');
        logSuccess(MESSAGES.SUCCESS.CURSOR_RULES_UPDATED);
      } else {
        logWarning(MESSAGES.WARNING.CURSOR_RULES_ALREADY_EXISTS);
      }
    } else {
      const newContent = CURSOR_RULES_TEMPLATE(VCMD_COMMAND_INSTRUCTION);
      
      writeFileSync(cursorVibeCmdPath, newContent, 'utf-8');
      logSuccess(MESSAGES.SUCCESS.CURSOR_RULES_CREATED);
    }

    logCelebration(`\n${MESSAGES.SUCCESS.INIT_COMPLETED}`);
    logGray('以下のファイルが作成/更新されました:');
    logGray(`  - ${configDest}`);
    logGray(`  - ${vibeCmdDirDest}/`);
    logGray(`  - ${claudeMdPath}`);
    logGray(`  - ${cursorVibeCmdPath}`);
  } catch (error) {
    handleError(MESSAGES.ERROR.INIT_FAILED, error);
  }
}