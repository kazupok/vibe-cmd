import chalk from 'chalk';
import { ICONS } from '../constants/index.js';

export function logError(message: string): void {
  console.log(chalk.red(`${ICONS.ERROR} ${message}`));
}

export function logSuccess(message: string): void {
  console.log(chalk.green(`${ICONS.SUCCESS} ${message}`));
}

export function logWarning(message: string): void {
  console.log(chalk.yellow(`${ICONS.WARNING} ${message}`));
}

export function logInfo(message: string): void {
  console.log(chalk.blue(`${ICONS.INFO} ${message}`));
}

export function logFolder(message: string): void {
  console.log(chalk.cyan(`${ICONS.FOLDER} ${message}`));
}

export function logList(message: string): void {
  console.log(chalk.blue(`${ICONS.LIST} ${message}`));
}

export function logChart(message: string): void {
  console.log(chalk.blue(`${ICONS.CHART} ${message}`));
}

export function logCelebration(message: string): void {
  console.log(chalk.blue(`${ICONS.CELEBRATION} ${message}`));
}

export function logGray(message: string): void {
  console.log(chalk.gray(message));
}

export function logBold(message: string): void {
  console.log(chalk.bold(message));
}

export function formatSelectedCommand(commandName: string): string {
  return chalk.blue(`\n${ICONS.LIST} 選択されたコマンド: ${commandName}`);
}

export function formatDescription(description: string): string {
  return chalk.gray(`説明: ${description}\n`);
}

export function formatPatternSuccess(pattern: string): string {
  return chalk.cyan(`${ICONS.FOLDER} ${pattern}`);
}

export function formatFileSuccess(file: string): string {
  return `  ${ICONS.SUCCESS} ${file}`;
}

export function formatPatternError(pattern: string, error: string): string {
  return chalk.red(`${ICONS.ERROR} ${pattern} (エラー: ${error})`);
}

export function formatPatternWarning(pattern: string): string {
  return chalk.yellow(`${ICONS.WARNING} ${pattern} (マッチするファイルなし)`);
}