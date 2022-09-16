import { print, colors, delay, confirmOrDie } from "../../../src/utils/misc";
import { getContractAt } from "../../../src/utils/support";

import * as ENV from "../../../src/utils/env";
const CONFIG = ENV.getConfig();

/* SQS */
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const sqsClient = new AWS.SQS({
  apiVersion: "2012-11-05",
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
});

const contractName = "MouseHero";
const configName = "MouseHero";

const delayTime = 200; // 200 ms

const totalMice = 41926;
let latestNftIdProcessed = 7502;

const DRY_RUN = false;

// The mktplace contract
let contract: any;

async function main() {
  try {
    print(colors.highlight, `Syncin the blockchain with the backend on ${CONFIG.name}...`);
    print(colors.h_blue, `Starting from ID ${latestNftIdProcessed}`);
    if (DRY_RUN) print(colors.h_green, `This is a DRY RUN; nothing will be sent anywhere.`);

    contract = await getContractAt(contractName, CONFIG[configName].address);

    //await confirmOrDie(`Are you sure you would like to sync on ${CONFIG.name}?`);

    for (let i = latestNftIdProcessed; i < totalMice; i++) {
      // get current owner of that mouse on the blockchain
      const owner = await contract.ownerOf(i + 1);
      if (!owner) {
        throw new Error("Owner not found");
      } else {
        print(colors.green, `Found Owner of NFT_ID ${i + 1}: ${owner}}`);
      }

      // Mount the transfer event to be sent to the backend
      const evt = mountTransferEvent(i + 1, owner);

      if (DRY_RUN) {
        print(
          colors.cyan,
          `[Would have] Synced Mouse NFT_ID ${i + 1} with params:\n${JSON.stringify(evt, null, 2)}`
        );
      } else {
        // relay it to the backend as if it was a transfer event (need SQS and the event model)
        let params = {
          MessageBody: JSON.stringify(evt),
          QueueUrl: "https://sqs.us-east-1.amazonaws.com/103281311910/nft-prod-mouse_transferred",
        };
        sqsClient.sendMessage(params, onCb);

        let params2 = {
          MessageBody: JSON.stringify(evt),
          QueueUrl:
            "https://sqs.us-east-1.amazonaws.com/103281311910/game-consumers-prod-mouse_transferred",
        };
        sqsClient.sendMessage(params2, onCb);

        latestNftIdProcessed = i;
        print(colors.success, `Synced Mouse NFT_ID ${i + 1}`);

        await delay(delayTime);
      }
    }
  } catch (e) {
    setTimeout(main, 2000);
    print(colors.yellow, `Will try again in 2 seconds`);
  }
}

function onCb(something: any) {
  //print(colors.highlight, `Callback from SQS: ${JSON.stringify(something, null, 2)}`);
}

function mountTransferEvent(nftId: number, owner: string) {
  return {
    name: "Transfer",
    from: "0xa57443c19301E6eEbCB6377a4f48965955588741",
    to: owner,
    nft_id: nftId,
    mouse_type: "mouse",
  };
}

main().catch((error) => {
  print(colors.error, error?.error);
  setTimeout(main, 2000);
});
