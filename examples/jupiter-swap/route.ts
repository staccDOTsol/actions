import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../openapi';
import sharp from 'sharp';

import {
  ActionsSpecErrorResponse,
  ActionsSpecGetResponse,
  ActionsSpecPostRequestBody,
  ActionsSpecPostResponse,
} from '../../spec/actions-spec';
import { Program, Provider, Idl, web3, BN, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fetch = require('node-fetch');

const width = 800; // width of the chart
const height = 600; // height of the chart
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });


const generateCandlestickChart = async (mint: any) => {
  const candlestickData = await getCandlestickData(mint);

  const labels = candlestickData.map((item: any) => new Date(item.timestamp * 1000).toLocaleDateString());
  const data = candlestickData.map((item : any) => ({
    x: new Date(item.timestamp * 1000),
    o: item.open,
    h: item.high,
    l: item.low,
    c: item.close,
  }));

  const configuration = {
    type: 'candlestick',
    data: {
      datasets: [{
        label: 'Candlestick Data',
        data: data,
      }],
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day',
          },
        },
      },
    },
  };

  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  return image;
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


const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL as string)
const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM")
const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf")
const provider = new AnchorProvider(connection, new Wallet(Keypair.generate()), {})
const program = new Program(idl as Idl, new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"), provider);

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
  const data = await response.json();
  return data;
};

const SWAP_AMOUNT_USD_OPTIONS = [10, 100, 1000];
const DEFAULT_SWAP_AMOUNT_USD = 10;
const US_DOLLAR_FORMATTING = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const app = new OpenAPIHono();

app.openapi(
  createRoute({
    method: 'get',
    path: '/{tokenPair}',
    tags: ['Degen Swap'],
    request: {
      params: z.object({
        tokenPair: z.string().openapi({
          param: {
            name: 'tokenPair',
            in: 'path',
          },
          type: 'string',
          example: 'USDC-SOL',
        }),
      }),
    },
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {
    const tokenPair = c.req.param('tokenPair');
    const [inputToken, outputToken] = tokenPair.split('-');

    const latestCoin = await getLatestPumpFunCoin();
    const kothCoin = await getKingOfTheHillCoin();
    const amountParameterName = 'amount';
    const dt = new Date().getTime();
    const image1 = await generateCandlestickChart(latestCoin.mint);
    const image2 = await generateCandlestickChart(kothCoin.mint);
    
    // Combine images side-by-side
    const combinedImage = await sharp({
      create: {
        width: width * 2,
        height: height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
      .composite([
        { input: image1, left: 0, top: 0 },
        { input: image2, left: width, top: 0 }
      ])
      .toBuffer();
    
    require('fs').writeFileSync(`/public/${dt}-candlestick-chart-combined.png`, combinedImage);
        const response: ActionsSpecGetResponse = {
      icon: `https://pumpwithfriens.fun/${dt}-candlestick-chart-combined.png`,
      label: `Buy ${outputToken}`,
      title: `Buy ${outputToken}`,
      description: `Buy ${outputToken} with ${inputToken}. Choose a SOL amount of ${inputToken} from the options below, or enter a custom amount.`,
      links: {
        actions: [
          ...SWAP_AMOUNT_USD_OPTIONS.map((amount) => ({
            label: `${US_DOLLAR_FORMATTING.format(amount)}`,
            href: `/api/pump/swap/${tokenPair}/${amount}`,
          })),
          {
            href: `/api/pump/swap/${tokenPair}/{${amountParameterName}}`,
            label: `Buy ${outputToken}`,
            parameters: [
              {
                name: amountParameterName,
                label: 'Enter a custom SOL amount',
              },
            ],
          },
        ],
      },
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'get',
    path: '/{tokenPair}/{amount}',
    tags: ['Degen Swap'],
    request: {
      params: z.object({
        tokenPair: z.string().openapi({
          param: {
            name: 'tokenPair',
            in: 'path',
          },
          type: 'string',
          example: 'USDC-SOL',
        }),
        amount: z
          .string()
          .optional()
          .openapi({
            param: {
              name: 'amount',
              in: 'path',
              required: false,
            },
            type: 'number',
            example: '1',
          }),
      }),
    },
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {
    const { tokenPair } = c.req.param();
    const [inputToken, outputToken] = tokenPair.split('-');

    const latestCoin = await getLatestPumpFunCoin();
    const kothCoin = await getKingOfTheHillCoin();
    const amountParameterName = 'amount';
    const dt = new Date().getTime();
    const image1 = await generateCandlestickChart(latestCoin.mint);
    const image2 = await generateCandlestickChart(kothCoin.mint);
    
    // Combine images side-by-side
    const combinedImage = await sharp({
      create: {
        width: width * 2,
        height: height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      }
    })
      .composite([
        { input: image1, left: 0, top: 0 },
        { input: image2, left: width, top: 0 }
      ])
      .toBuffer();
    
    require('fs').writeFileSync(`/public/${dt}-candlestick-chart-combined.png`, combinedImage);
        const response: ActionsSpecGetResponse = {
      icon: `https://pumpwithfriens.fun/${dt}-candlestick-chart-combined.png`,
      label: `Buy ${outputToken}`,
      title: `Buy ${outputToken} with ${inputToken}`,
      description: `Buy ${outputToken} with ${inputToken}.`,
      links: {
        actions: []
      },
      error: {
        message: ''
      }
    };

    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/buy',
    tags: ['Pump Buy'],
    request: {
      params: z.object({
        mint: z.string(),
        amount: z.number(),
        maxSolCost: z.number(),
        user: z.string(),
      }),
    },

    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {

    const mint = new PublicKey(c.req.param('mint') as string);
    const amount = c.req.param('amount') ?? DEFAULT_SWAP_AMOUNT_USD.toString();
    const maxSolCost = c.req.param('maxSolCost')
    const { account } = (await c.req.json()) as ActionsSpecPostRequestBody;
    const user = account
    const mintPublicKey = new PublicKey(mint);
    const userPublicKey = new PublicKey(user);

    const bondingCurvePublicKey = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPublicKey.toBuffer()],
      program.programId
    )[0];

    const associatedBondingCurvePublicKey = getAssociatedTokenAddressSync(
      mintPublicKey,
      bondingCurvePublicKey,
      true
    );

    const response: ActionsSpecPostResponse = {
      transaction: bs58.encode((await program.methods.buy(new BN(amount), new BN(maxSolCost)).accounts({
        global,
        feeRecipient,
        mint: mintPublicKey,
        bondingCurve: bondingCurvePublicKey,
        associatedBondingCurve: associatedBondingCurvePublicKey,
        associatedUser: getAssociatedTokenAddressSync(mintPublicKey, userPublicKey),
        user: userPublicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .transaction()).serialize({requireAllSignatures: false, verifySignatures: false})),
    };
    return c.json(response);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/sell',
    tags: ['Pump Sell'],
    request: {
      params: z.object({
        mint: z.string(),
        amount: z.number(),
        minSolOutput: z.number(),
        user: z.string(),
      })
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {

    const mint = new PublicKey(c.req.param('mint') as string);
    const amount = c.req.param('amount') ?? DEFAULT_SWAP_AMOUNT_USD.toString();
    const maxSolCost = c.req.param('maxSolCost')
    const { account } = (await c.req.json()) as ActionsSpecPostRequestBody;
    const user = account
    const mintPublicKey = new PublicKey(mint);
    const userPublicKey = new PublicKey(user);

    const bondingCurvePublicKey = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPublicKey.toBuffer()],
      program.programId
    )[0];

    const associatedBondingCurvePublicKey = getAssociatedTokenAddressSync(
      mintPublicKey,
      bondingCurvePublicKey,
      true
    );

    

      const response: ActionsSpecPostResponse = {
        transaction: bs58.encode((await program.methods.sell(new BN(amount), new BN(0)).accounts({
          global,
          feeRecipient,
          mint: mintPublicKey,
          bondingCurve: bondingCurvePublicKey,
          associatedBondingCurve: associatedBondingCurvePublicKey,
          associatedUser: getAssociatedTokenAddressSync(mintPublicKey, userPublicKey),
          user: userPublicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .transaction()).serialize({requireAllSignatures: false, verifySignatures: false})),
      };
      return c.json(response);
  },
);

export default app;