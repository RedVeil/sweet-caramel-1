import { BeneficiaryApplication } from "@popcorn/hardhat/lib/adapters";
import axios, { AxiosResponse } from "axios";
import { getIpfsHashFromBytes32 } from "../ipfsHashManipulation";

export interface IIpfsClient {
  get: (cid: string) => Promise<BeneficiaryApplication>;
  add: (beneficiaryApplication: BeneficiaryApplication) => Promise<string>;
  upload: (file: File, setUploadProgress?: (progress: number) => void) => Promise<UploadResult>;
}

export interface UploadResult {
  status: number;
  hash?: string;
  errorDetails?: string;
  fileName?: string;
}

export const IpfsClient: IIpfsClient = {
  get: async (cid: string): Promise<BeneficiaryApplication> => {
    const beneficiaryApplication: BeneficiaryApplication = await fetch(
      `${process.env.IPFS_URL}${getIpfsHashFromBytes32(cid)}`,
    ).then((response) => response.json());
    return beneficiaryApplication;
  },

  add: async (beneficiaryApplication: BeneficiaryApplication): Promise<string> => {
    const headers = {
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_API_SECRET,
      "Content-Type": "application/json",
    };
    let cid = "";
    try {
      const response = (await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS/",
        JSON.stringify(beneficiaryApplication),
        { headers },
      )) as AxiosResponse<{ IpfsHash: string }>;
      cid = response.data.IpfsHash;
    } catch (e) {
      console.error(e);
    }
    return cid;
  },

  upload: async (file: File, setUploadProgress?: (progress: number) => void): Promise<UploadResult> => {
    var data = new FormData();
    data.append("file", file, file.name);
    const headers = {
      "Content-Type": `multipart/form-data;`,
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_API_SECRET,
    };
    const config = setUploadProgress
      ? {
          headers,
          onUploadProgress: (progressEvent) => {
            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
        }
      : {
          headers,
        };
    return await axios
      .post(`${process.env.IPFS_GATEWAY_PIN}`, data, config)
      .then((result) => {
        return {
          hash: result.data.IpfsHash,
          status: result.status,
          fileName: file.name,
        };
      })
      .catch((error) => {
        if (error.response) {
          return {
            status: error.response.status,
            errorDetails: error.response.data.error.details,
            fileName: file.name,
          };
        }
        return error;
      });
  },
};
