import axios from "axios";

import config from "../config";

// expects a Date and returns a block number
export async function getBlockByDate(date: Date) {
  const baseUrl = config.bsc.services.holders.baseUrl;
  const apiKey = config.bsc.services.holders.apiKey;
  const chainId = config.bsc.chainId;

  const startDateString = `${date.toISOString().split(".")[0]}z`;
  const endDate = new Date(date.getTime() + 1000 * 5);
  const endDateString = `${endDate.toISOString().split(".")[0]}z`;

  ///v1/chain_id/block_v2/2021-01-…/2021-01-…/
  const url = `${baseUrl}${chainId}/block_v2/${startDateString}/${endDateString}/?key=${apiKey}`;

  //console.log(`getBlockByDate::Date: ${date.toISOString()}`);
  //console.log(`getBlockByDate::Url: ${url}`);

  const response: any = await axios.get(url).catch((e) => {
    throw e;
  });

  const block = response.data.data.items ? response.data.data.items[0]?.height : null;

  return block;
}

export async function getBlocksByDates(dates: Date[]) {
  const blocks = [];

  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    const block = await getBlockByDate(date);
    blocks.push({ date: date.toISOString(), block });
  }

  return blocks;
}

export async function getRetroactiveBlocks(numberOfDays: number = 1) {
  const dates = [];

  const todayTimezonedString = new Date().toISOString();
  let todayUTC = new Date(todayTimezonedString.slice(0, -1));
  todayUTC.setHours(0, 0, 0, 0);

  for (let i = 0; i < numberOfDays; i++) {
    const thatDay = todayUTC.getTime() - 1000 * 60 * 60 * 24 * i;
    const newDate = new Date(thatDay);
    dates.push(newDate);
  }

  const blocks = await getBlocksByDates(dates);

  return blocks;
}

async function exec() {
  const result = {
    block_march: await getBlockByDate(new Date("2022-04-01")),
    block_february: await getBlockByDate(new Date("2022-03-01")),
    block_january: await getBlockByDate(new Date("2022-02-01")),
    block_december: await getBlockByDate(new Date("2022-01-01")),
    block_november: await getBlockByDate(new Date("2021-12-01")),
    block_october: await getBlockByDate(new Date("2021-11-01")),
  };

  console.log(JSON.stringify(result, null, 2));
}

exec();
