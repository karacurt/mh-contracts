import bsc from "./bsc";
import bscTestnet from "./bscTestnet";
import bscHomolog from "./bscHomolog";
import bscStaging from "./bscStaging";

const config = {
  bscTestnet,
  bscHomolog,
  bscStaging,
  bsc,
};

export default config;

export type Network = "bsc" | "bscTestnet" | "bscHomolog" | "bscStaging";
