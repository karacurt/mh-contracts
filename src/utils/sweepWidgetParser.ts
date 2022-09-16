import * as path from "path";

import * as csv from "./csvToJson";
import { isAddress, colors, print } from "./misc";

// Log level varies from 0 to 3
const LOG_LEVEL = 0;

/**
 * @param csvPath Where we find the csv file downloaded from Sweep Widget
 * @param nameKey The name of the field in which we expect the user's name
 * @param emailKey The name of the field in which we expect the user's email
 * @param addressKey The name of the field in which we expect the user's EVM address
 * @param countryKey The name of the field in which we expect the user's country
 */
export async function parse(
  csvPath: string,
  nameKey: string = "field2",
  emailKey: string = "field3",
  addressKey: string = "field8",
  countryKey: string = "field11"
) {
  print(colors.wait, `Parsing Sweep Widget List. Please wait...`);

  // convert from CSV to JSON
  const jsonList = await csv.toJson(path.resolve(csvPath));

  if (LOG_LEVEL >= 3)
    print(colors.success, `Sweep Widget List parsed: ${JSON.stringify(jsonList, null, 2)}`);

  // Get only lines that have a valid EVM address
  const cleanList = jsonList.filter((item) => {
    return isAddress(item[addressKey]);
  });

  if (LOG_LEVEL >= 2)
    print(colors.success, `Sweep Widget List cleaned up: ${JSON.stringify(cleanList, null, 2)}`);

  const prettyList: any = [];
  cleanList.forEach((item) => {
    prettyList.push({
      name: item[nameKey],
      email: item[emailKey],
      address: item[addressKey],
      country: item[countryKey],
    });
  });

  if (LOG_LEVEL >= 1)
    print(colors.success, `Sweep Widget List prettified: ${JSON.stringify(prettyList, null, 2)}`);

  print(colors.success, `Found ${cleanList.length} valid Sweep Widget entries`);

  // Return the json
  return prettyList;
}
