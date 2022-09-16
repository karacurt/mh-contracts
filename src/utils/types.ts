/* eslint-disable camelcase */

export interface Properties extends Record<string, string> {
  asset_name: string;
}

// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1155.md#erc-1155-metadata-uri-json-schema
export interface MetadataEnjin {
  name: string;
  description: string;
  // external_url: string;
  // animation_url: string;
  image: string;
  properties: Properties;
}

export type Metadata = MetadataEnjin;

export default {};
