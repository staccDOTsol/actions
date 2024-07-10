import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { ActionGetResponse, ActionPostRequest, ActionPostResponse, MEMO_PROGRAM_ID } from '@solana/actions';
import { Program, Provider, Idl, web3, BN, AnchorProvider, Wallet, LangErrorCode } from '@coral-xyz/anchor';
import { AddressLookupTableAccount, ComputeBudgetProgram, Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction, TransactionMessage, VersionedTransaction } from '@solana/web3.js';
import { createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { base64, bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../openapi';
import { ChartConfiguration, ChartType } from 'chart.js';
const fetch = require('node-fetch');
import FormData from 'form-data';
import imgur from 'imgur';
const Imgur = new imgur({
  clientId:'06f787d29bb77bf',
  clientSecret:'6ea80630f383c1316d820e46264d589e104cd8a8'
})
const { ChartConfiguration } = require( "chart.js" );
import jupiterApi from './jupiter-api';
import { createJupiterApiClient } from '@jup-ag/api';

const jupiterQuoteApi = createJupiterApiClient(); // config is optional

const SWAP_AMOUNT_USD_OPTIONS_USD = [10, 100, 1000];
const DEFAULT_SWAP_AMOUNT_USD = 10;
const US_DOLLAR_FORMATTING = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
// Chart generation setup
const width = 800;
const height = 600;
// Function to upload image to Imgur with caching
const cache = new Map();

const uploadImageToImgur = async (image: string) => {
  if (cache.has(image)) {
    console.log('Returning cached image link');
    return cache.get(image);
  }

  try {
    const response = await Imgur.upload({
      image,
      type: "base64"
    });
    console.log(response.data);
    const link = response.data.link;
    cache.set(image, link);
    return link;
  } catch (error) {
    console.error('Error uploading image to Imgur:', error);
    throw error;
  }
};

const idl = {
  "version": "0.1.0",
  "name": "pump",
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Creates the global state."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "setParams",
      "docs": [
        "Sets the global state parameters."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "feeRecipient",
          "type": "publicKey"
        },
        {
          "name": "initialVirtualTokenReserves",
          "type": "u64"
        },
        {
          "name": "initialVirtualSolReserves",
          "type": "u64"
        },
        {
          "name": "initialRealTokenReserves",
          "type": "u64"
        },
        {
          "name": "tokenTotalSupply",
          "type": "u64"
        },
        {
          "name": "feeBasisPoints",
          "type": "u64"
        }
      ]
    },
    {
      "name": "create",
      "docs": [
        "Creates a new coin and bonding curve."
      ],
      "accounts": [
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mplTokenMetadata",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "symbol",
          "type": "string"
        },
        {
          "name": "uri",
          "type": "string"
        }
      ]
    },
    {
      "name": "buy",
      "docs": [
        "Buys tokens from a bonding curve."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeRecipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "maxSolCost",
          "type": "u64"
        }
      ]
    },
    {
      "name": "sell",
      "docs": [
        "Sells tokens into a bonding curve."
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "feeRecipient",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "minSolOutput",
          "type": "u64"
        }
      ]
    },
    {
      "name": "withdraw",
      "docs": [
        "Allows the admin to withdraw liquidity for a migration once the bonding curve completes"
      ],
      "accounts": [
        {
          "name": "global",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedBondingCurve",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedUser",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "program",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Global",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initialized",
            "type": "bool"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "feeRecipient",
            "type": "publicKey"
          },
          {
            "name": "initialVirtualTokenReserves",
            "type": "u64"
          },
          {
            "name": "initialVirtualSolReserves",
            "type": "u64"
          },
          {
            "name": "initialRealTokenReserves",
            "type": "u64"
          },
          {
            "name": "tokenTotalSupply",
            "type": "u64"
          },
          {
            "name": "feeBasisPoints",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "BondingCurve",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "virtualTokenReserves",
            "type": "u64"
          },
          {
            "name": "virtualSolReserves",
            "type": "u64"
          },
          {
            "name": "realTokenReserves",
            "type": "u64"
          },
          {
            "name": "realSolReserves",
            "type": "u64"
          },
          {
            "name": "tokenTotalSupply",
            "type": "u64"
          },
          {
            "name": "complete",
            "type": "bool"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CreateEvent",
      "fields": [
        {
          "name": "name",
          "type": "string",
          "index": false
        },
        {
          "name": "symbol",
          "type": "string",
          "index": false
        },
        {
          "name": "uri",
          "type": "string",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "bondingCurve",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        }
      ]
    },
    {
      "name": "TradeEvent",
      "fields": [
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "solAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "isBuy",
          "type": "bool",
          "index": false
        },
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "virtualSolReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "virtualTokenReserves",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "CompleteEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "bondingCurve",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "SetParamsEvent",
      "fields": [
        {
          "name": "feeRecipient",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "initialVirtualTokenReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "initialVirtualSolReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "initialRealTokenReserves",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenTotalSupply",
          "type": "u64",
          "index": false
        },
        {
          "name": "feeBasisPoints",
          "type": "u64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "NotAuthorized",
      "msg": "The given account is not authorized to execute this instruction."
    },
    {
      "code": 6001,
      "name": "AlreadyInitialized",
      "msg": "The program is already initialized."
    },
    {
      "code": 6002,
      "name": "TooMuchSolRequired",
      "msg": "slippage: Too much SOL required to buy the given amount of tokens."
    },
    {
      "code": 6003,
      "name": "TooLittleSolReceived",
      "msg": "slippage: Too little SOL received to sell the given amount of tokens."
    },
    {
      "code": 6004,
      "name": "MintDoesNotMatchBondingCurve",
      "msg": "The mint does not match the bonding curve."
    },
    {
      "code": 6005,
      "name": "BondingCurveComplete",
      "msg": "The bonding curve has completed and liquidity migrated to raydium."
    },
    {
      "code": 6006,
      "name": "BondingCurveNotComplete",
      "msg": "The bonding curve has not completed."
    },
    {
      "code": 6007,
      "name": "NotInitialized",
      "msg": "The program is not initialized."
    }
  ],
  "metadata": {
    "address": "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
  }
}
import 'chartjs-adapter-date-fns'; // Import the date adapter
import path from 'path';

// Connection and program setup
const connection = new Connection(process.env.NEXT_PUBLIC_MAINNET_RPC_URL as string);
const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
const provider = new AnchorProvider(connection, new Wallet(Keypair.generate()), {});
const program = new Program(idl as Idl, new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"), provider);


const SWAP_AMOUNT_USD_OPTIONS = [0.1, 1, 5];
// Function to fetch the latest Pump.fun coin
const getLatestPumpFunCoin = async () => {
  const response = await fetch('https://frontend-api.pump.fun/coins/latest');
  const data = await response.json();
  return data;
};

// Function to fetch the King of the Hill Pump.fun coin
const getKingOfTheHillCoin = async () => {
  const response = await fetch('https://frontend-api.pump.fun/coins/king-of-the-hill?includeNsfw=true');
  const data = await response.json();
  return data;
};

// Function to fetch candlestick data for a given mint
const getCandlestickData = async (mint: string) => {
  const response = await fetch(`https://frontend-api.pump.fun/candlesticks/${mint}?offset=0&limit=1000&timeframe=1`);
  const rawData = await response.json();
  const formattedData = rawData.map((item: any) => ({
    mint: item.mint,
    timestamp: item.timestamp,
    open: item.open,
    high: item.high,
    low: item.low,
    close: item.close,
    volume: item.volume,
    slot: item.slot,
    is5Min: item.is_5_min,
    is1Min: item.is_1_min,
  }));
  return formattedData;
};

const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
const generateCandlestickChart = async (mint: any, candlestickData: any, data2?: any | undefined) => {
  const labels = data2 ? data2.map((item: any, index: number) => index + 1) :candlestickData.map((item: any, index: number) => index + 1);
  const data = candlestickData.map((item: any) => ({
    x: item.timestamp, // Use the sequential label
    y: item.close,
  }));
  console.log(data)

  const configuration: any = {

    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Candlestick Data',
        data: data,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }],
    },
    options: {
      scales: {
      
      },
    },
  };
  if (data2 != undefined){
    configuration.data.datasets.push({
      label: 'KOTH Data',
      data: data2.map((item: any) => ({
        x: item.timestamp, // Use the sequential label
        y: item.close,
      })),
      borderColor: 'rgba(255, 99, 132, 1)',
      borderWidth: 1,
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
    })
  }
// @ts-ignore
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  const path = new Date().getTime().toString()+'.png'
  return {image}
};
const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Degen Swap'],
    request: {

    },
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {

    const latestCoin = await getLatestPumpFunCoin();
    const kothCoin = await getKingOfTheHillCoin();
    const amountParameterName = 'amount';

    const messageParamaterName = 'message';

    const caParamaterName = 'ca';

    

    const dt = new Date().getTime();
    const candlestickData = await getCandlestickData(latestCoin.mint);
    const candlestickData2 = await getCandlestickData(kothCoin.mint);

    const i1 = await generateCandlestickChart(latestCoin.mint, candlestickData, candlestickData2) as any



    const response: ActionsSpecGetResponse = {
      icon:  'https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/',
      label: `Enter a ca for your custom tokengated message`,
      title: `Enter a ca for your custom tokengated message`,
      description: `Enter a ca for your custom tokengated message. then check the blockchain ur tweetable link is there in memo`,
      links: {
        actions: [
          
          {
            href: `/{${caParamaterName}}/1/{${messageParamaterName}}`,
            label: 'new message w your CA',
            parameters: [
              {
                name: caParamaterName,
                label: 'CA...',
              },
              // @ts-ignore
              {
                name: amountParameterName,
                label: 'amount...'
              },
              // @ts-ignore
              {
                name: messageParamaterName,
                label: 'message...'
              },
              

            ],
          },
        ]
      },
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/{slug}',
    tags: ['Degen Swap'],
    request: {
      params:   z.object({
        slug: z.string().openapi({
          param: {
            name: 'slug',
            in: 'path',
          },
          type: 'string',
          example: 'abc',
        }),
      })
    },
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {

    const slug = c.req.param('slug');
const slugParamaterName = 'slug'

    const response: ActionsSpecGetResponse = {
      icon:  'https://ucarecdn.com/7aa46c85-08a4-4bc7-9376-88ec48bb1f43/-/preview/880x864/-/quality/smart/-/format/auto/',
      label: `Smash the magick button to see if you can see a fancy message`,
      title: `Smash the magick button to see if you can see a fancy message`,
      description: `Smash the magick button to see if you can see a fancy message`,
      links: {
        actions: [
          
          {
            href: `/slug/{${slugParamaterName}`,
            label: 'magick',
            
          },
        ]
      },
    };

    return c.json(response);
  },
);

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs'
import { ActionsSpecGetResponse } from '../../spec/actions-spec';
const mapOfCasToMessages = new Map()

app.openapi(
  createRoute({
    method: 'post',
    path: '/slug/{slug',
    tags: ['Degen Swap'],
    request: {
      params:   z.object({
        slug: z.string().openapi({
          param: {
            name: 'slug',
            in: 'path',
          },
          type: 'string',
          example: 'DJRgUnw19oBtgchjsDLed3h6PHFH3NcwxcmzAgsfpump',
        })
      })
    },
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {
    const slug =
    c.req.param('slug') ;
  const { account } = (await c.req.json()) as ActionPostRequest;
  const slugged = mapOfCasToMessages.get(slug)
  const tx = new Transaction().add(SystemProgram.transfer({
    fromPubkey: new PublicKey(account),
    toPubkey: new PublicKey("99VXriv7RXJSypeJDBQtGRsak1n5o2NBzbtMXhHW2RNG"),
    lamports: 0.01 * 10 ** 9
  }))
tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
tx.feePayer = new PublicKey(account)
  if (!slugged)  {
    tx.add(new TransactionInstruction({
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: Buffer.from("Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!'),
    }))
    
    const response: ActionPostResponse = {
      message: "Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!',
      transaction: Buffer.from(tx.serialize({requireAllSignatures: false, verifySignatures: false})).toString('base64'),
    };
  
    return c.json(response, 200);
  }  

  const owner = await connection.getAccountInfo(new PublicKey(slugged.ca))
  
  if (!owner) {
    tx.add(new TransactionInstruction({
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ID),
      data: Buffer.from("Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!'),
    }))
    
    const response: ActionPostResponse = {
      message: "Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!',
      transaction: Buffer.from(tx.serialize({requireAllSignatures: false, verifySignatures: false})).toString('base64'),
    };
  
    return c.json(response, 200);
  } 
const ata = getAssociatedTokenAddressSync(new PublicKey(slugged.ca), new PublicKey(account), true, owner.owner)
const ataAiMaybe = connection.getAccountInfo(ata)

if (!ataAiMaybe) {
  tx.add(new TransactionInstruction({
    keys: [],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from("Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!'),
  }))
  
  const response: ActionPostResponse = {
    message: "Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!',
    transaction: Buffer.from(tx.serialize({requireAllSignatures: false, verifySignatures: false})).toString('base64'),
  };

  return c.json(response, 200);
} 
const balance = Number((await connection.getTokenAccountBalance(ata)).value.uiAmount)

if (balance > Number(slugged.amount)){
  tx.add(new TransactionInstruction({
    keys: [],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from("Message: " + slugged.message)
  }))
  
  const response: ActionPostResponse = {
    message: slugged.message,
    transaction: Buffer.from(tx.serialize({requireAllSignatures: false, verifySignatures: false})).toString('base64'),
  };

  return c.json(response, 200);
}
else {
  tx.add(new TransactionInstruction({
    keys: [],
    programId: new PublicKey(MEMO_PROGRAM_ID),
    data: Buffer.from("Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!'),
  }))
  const response: ActionPostResponse = {
    message: "Sorry, " + slugged.amount + ' ' + slugged.ca + ' required!',
    transaction: Buffer.from(tx.serialize({requireAllSignatures: false, verifySignatures: false})).toString('base64'),
  };

  return c.json(response, 200);
}})
app.openapi(
  createRoute({
    method: 'post',
    path: '/{ca}/{which}/{message}',
    tags: ['Degen Swap'],
    request: {
      params:   z.object({
        ca: z.string().openapi({
          param: {
            name: 'ca',
            in: 'path',
          },
          type: 'string',
          example: 'DJRgUnw19oBtgchjsDLed3h6PHFH3NcwxcmzAgsfpump',
        }),
        which: z.string().openapi({
          param: {
            name: 'which',
            in: 'path',
          },
          type: 'string',
          example: '1',
        }),
      message: z.string().openapi({
        param: {
          name: 'message',
          in: 'path',
        },
        type: 'string',
        example: 'Your custom message here',
      }),
      })
    },
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {
    const ca = c.req.param('ca');
    const which = c.req.param('which');
    const message = c.req.param('message');
    const { account } = (await c.req.json()) as ActionPostRequest;

    // Generate a unique slug
    const slug = uuidv4();
    
    // Save the message to the map using the slug as the key
    mapOfCasToMessages.set(slug, {ca, which, message});
    const tx = new Transaction().add(SystemProgram.transfer({
      fromPubkey: new PublicKey(account),
      toPubkey: new PublicKey("99VXriv7RXJSypeJDBQtGRsak1n5o2NBzbtMXhHW2RNG"),
      lamports: 0.01 * 10 ** 9
    }))
    
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  tx.feePayer = new PublicKey(account)
    // Log the saved data for debugging
    console.log(`Saved message for slug ${slug}: ${message}`);
const tweetIt = "https://twitter.com/intent/tweet?text=" + encodeURIComponent("https://tokenblink-556d711c7656.herokuapp.com/"+slug)
    // Redirect to the GET endpoint
console.log((tweetIt))
tx.add(new TransactionInstruction({
  keys: [],
  programId: new PublicKey(MEMO_PROGRAM_ID),
  data: Buffer.from("tweet it: " + tweetIt)
}))

    const response: ActionPostResponse = {
      message: tweetIt,
      transaction: Buffer.from(tx.serialize({requireAllSignatures: false, verifySignatures: false})).toString('base64'),
    };
  
    return c.json(response, 200);
    });

export default app;
