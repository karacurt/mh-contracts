// eslint-disable-next-line node/no-unpublished-import
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import Web3 from "web3";
import * as readline from "readline";

/**
 * List of colors to be used in the `print` function
 */
export const colors = {
  // simple font colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // highlights
  h_black: "\x1b[40m\x1b[37m",
  h_red: "\x1b[41m\x1b[37m",
  h_green: "\x1b[42m\x1b[30m",
  h_yellow: "\x1b[43m\x1b[30m",
  h_blue: "\x1b[44m\x1b[37m",
  h_magenta: "\x1b[45m\x1b[37m",
  h_cyan: "\x1b[46m\x1b[30m",
  h_white: "\x1b[47m\x1b[30m",

  // aliases
  highlight: "\x1b[47m\x1b[30m", // white bg and black font
  error: "\x1b[41m\x1b[37m💥 ", // red bg, white font and explosion emoji
  success: "\x1b[32m✅ ", // green font and check emoji
  bigSuccess: "\x1b[42m\x1b[30m✅ ", // green bg, black font and check emoji
  warn: "\x1b[43m\x1b[30m📣 ", // yellow bg, black font and megaphone emoji
  wait: "\x1b[33m🕑 ", // yellow font and clock emoji
  account: "\x1b[37m🐭 ", // white font and mouse face emoji

  // mandatory close
  close: "\x1b[0m",
};

/**
 * Prints a colored message on your console/terminal
 * @param {string} color Can be one of the above colors
 * @param {string} message Whatever string
 * @param {bool} breakLine Should it break line after the message?
 * @example print(colors.green, "something");
 */
export function print(color: string, message: string, breakLine: boolean = false) {
  const lb = breakLine ? "\n" : "";
  console.log(`${color}${message}${colors.close}${lb}`);
}

// Helper functions to aid comparing implementations wrt gas costs
export function logGasDiff(
  title: string,
  original: number,
  current: number,
  useShortTitle: boolean = false
) {
  const separator = useShortTitle ? "---" : "~~~~~~~~~~~~";
  print(colors.cyan, `${separator}\n${title}`);
  print(colors.magenta, `Original: ${original}`);
  print(colors.magenta, `Current : ${current}`);

  const pct = Math.abs((1 - current / original) * 100).toFixed(2);
  const diff = current - original;

  print(getColorName(diff), `Diff    : ${diff} (${pct}%)`);
}
function getColorName(value: number) {
  if (value > 0) {
    return colors.red;
  } else if (value < 0) {
    return colors.green;
  } else {
    return colors.white;
  }
}

// function that converts an ETH value to Wei (1e18)
export const toWei = ethers.utils.parseEther;

// function that converts an address to its checksum form
export const addr = ethers.utils.getAddress;

interface FileNameStandard {
  prefix: string;
  extension: string;
  directory: string;
}
/**
 * Receives an object with the following properties, all of which are optional:
 * @param {string} prefix The actual name of the file, something like 'whitelist'
 * @param {string} extension The extension of the file, such as 'json'
 * @param {string} directory The target directory of the file, something like 'data'
 * @returns {string} The generated filename, something like 'data/whitelist_14_sep_2021.json'
 */
export function generateTodayFilename({ prefix, extension, directory }: FileNameStandard): string {
  // setup month names
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // get current date (we do it manually so that it's not dependant on user's locale)
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = monthNames[today.getMonth()];
  const year = today.getFullYear();
  let finalDate;

  directory = directory ? `${directory}/` : "";
  prefix = prefix ? `${prefix}_` : "";
  finalDate = `${day}_${month}_${year}`;
  extension = extension ? extension : "json";

  // transform it in a string with the following format:
  // 'myDirectory/whitelist_mainnet_update_14_sep_2021.json' where
  // 'myDirectory' is `directory`
  // 'whitelist_mainnet_update' is `prefix`
  // '14_sep_2021' is today's date
  // and 'json' is `extension`
  const filename = `${directory}${prefix}${finalDate}.${extension}`;
  return filename;
}

export function isAddress(address: string): boolean {
  return Web3.utils.isAddress(address);
}

export function wei(value: string): BigNumber {
  return ethers.utils.parseEther(value);
}

export function toWeiString(value: string): string {
  return ethers.utils.parseEther(value).toString();
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// returns an address that won't be used in tests
// for when something demands a valid address,
// but it doesn't matter which address it is.
export const anyValidEvmAddress = "0xfc854524613dA7244417908d199857754189633c";

// Expects the user to answer "yes". If they don't, the process is killed.
export async function confirmOrDie(query: string) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  print(colors.h_red, `✋ ${query}`);

  const answer = await new Promise((resolve) =>
    rl.question("> [yes/no] ", (ans) => {
      rl.close();
      resolve(ans);
    })
  );

  if (answer !== "yes") {
    print(colors.warn, `Aborted by the operator.`);
    process.exit(1);
  } else {
    print(colors.green, `Confirmed! Continuing...`);
  }
}

export function random(min: number, max: number, decimals: number = 2) {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}
