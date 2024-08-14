<script setup lang="ts">
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { Program,  web3, BN, AnchorProvider, LangErrorCode } from '@coral-xyz/anchor';
import type { Provider, Idl } from '@coral-xyz/anchor';
import * as anchor from '@coral-xyz/anchor';
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { base64, bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { ref, onMounted } from 'vue';
import Chart from 'chart.js/auto';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration, ChartType } from 'chart.js';
import FormData from 'form-data';
import imgur from 'imgur';
import 'chartjs-adapter-date-fns';
import path from 'path';
    
const Imgur = new imgur({
  clientId: '06f787d29bb77bf',
  clientSecret: '6ea80630f383c1316d820e46264d589e104cd8a8'
});

const width = 800;
const height = 600;
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
  } catch (error:any) {
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
};
const errorMessage = ref('');
const successMessage = ref('');
interface Coin {
  mint: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  priceChange24h: number;
  candlestickData?: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

const chartList = ref<Coin[]>([]);
const amount = ref(0.1);
const customAmount = ref(null);
const connection = new Connection('https://api.mainnet-beta.solana.com');
const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
// @ts-ignore
const provider = new AnchorProvider(connection);
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

const fetchKothCoin = async () => {
  try {
    const newCoin = await getKingOfTheHillCoin();
    const existingCoin = chartList.value.find(coin => coin.mint === newCoin.mint);
    if (!existingCoin) {
      const candlestickData = await getCandlestickData(newCoin.mint);
      chartList.value.unshift({ ...newCoin, candlestickData } as Coin);    }
  } catch (error:any) {
    errorMessage.value = 'Failed to fetch King of the Hill coin data: ' + error.message;
  }
};

const renderChart = (canvas: HTMLCanvasElement, candlestickData: any) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const labels = candlestickData.map((item: any) => new Date(item.timestamp * 1000).toLocaleDateString());
  const data = candlestickData.map((item: any) => item.close);

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Price',
        data,
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      }],
    },
    options: {
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'day'
          }
        }
      }
    }
  });
};

const buyCoin = async (coin: any) => {
  try {
    const amountToBuy = customAmount.value ?? amount.value;
    const userPublicKey = new PublicKey('YOUR_PUBLIC_KEY_HERE'); // Replace with actual user public key
    const mintPublicKey = new PublicKey(coin.mint);
    const bondingCurvePublicKey = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPublicKey.toBuffer()],
      program.programId
    )[0];
    const associatedBondingCurvePublicKey = getAssociatedTokenAddressSync(
      mintPublicKey,
      bondingCurvePublicKey,
      true
    );
    const associatedUser = await getAssociatedTokenAddressSync(mintPublicKey, userPublicKey);
    const transaction = await program.methods.buy(new BN(amountToBuy * 10 ** 6), new BN(Number.MAX_SAFE_INTEGER)).accounts({
      global,
      feeRecipient,
      mint: mintPublicKey,
      bondingCurve: bondingCurvePublicKey,
      associatedBondingCurve: associatedBondingCurvePublicKey,
      associatedUser,
      user: userPublicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
      .preInstructions([
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: new PublicKey("Czbmb7osZxLaX5vGHuXMS2mkdtZEXyTNKwsAUUpLGhkG"),
          lamports: 0.01 * 10 ** 9,
        }),
      ])
      .transaction();
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = userPublicKey;
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
    successMessage.value = 'Transaction successful!';
  } catch (error:any) {
    errorMessage.value = 'Transaction failed: ' + error.message;
  }
};

const sellCoin = async (coin: any) => {
  try {
    const amountToSell = customAmount.value ?? amount.value;
    const userPublicKey = new PublicKey('YOUR_PUBLIC_KEY_HERE'); // Replace with actual user public key
    const mintPublicKey = new PublicKey(coin.mint);
    const bondingCurvePublicKey = PublicKey.findProgramAddressSync(
      [Buffer.from('bonding-curve'), mintPublicKey.toBuffer()],
      program.programId
    )[0];
    const associatedBondingCurvePublicKey = getAssociatedTokenAddressSync(
      mintPublicKey,
      bondingCurvePublicKey,
      true
    );
    const associatedUser = await getAssociatedTokenAddressSync(mintPublicKey, userPublicKey);
    const transaction = await program.methods.sell(new BN(amountToSell * 10 ** 6), new BN(0)).accounts({
      global,
      feeRecipient,
      mint: mintPublicKey,
      bondingCurve: bondingCurvePublicKey,
      associatedBondingCurve: associatedBondingCurvePublicKey,
      associatedUser,
      user: userPublicKey,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
    })
      .preInstructions([
        SystemProgram.transfer({
          fromPubkey: userPublicKey,
          toPubkey: new PublicKey("Czbmb7osZxLaX5vGHuXMS2mkdtZEXyTNKwsAUUpLGhkG"),
          lamports: 0.01 * 10 ** 9,
        }),
      ])
      .transaction();
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = userPublicKey;
    const serializedTransaction = transaction.serialize({ requireAllSignatures: false, verifySignatures: false });
    successMessage.value = 'Transaction successful!';
  } catch (error:any) {
    errorMessage.value = 'Transaction failed: ' + error.message;
  }
};

onMounted(() => {
  fetchKothCoin();
  setInterval(fetchKothCoin, 60000); // Fetch new data every minute
});
</script>

<template>
  <div>
    <h1>King of the Hill Coins</h1>
    <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
    <div v-if="successMessage" class="text-green-500">{{ successMessage }}</div>
    <div v-for="coin in chartList" :key="coin.mint" class="mb-4">
      <h2>{{ coin.name }}</h2>
      <canvas :ref="'chartCanvas' + coin.mint"></canvas>
      <div>
        <label for="amount">Amount:</label>
        <select v-model="amount">
          <option v-for="option in [0.1, 1, 5]" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
      <div>
        <label for="customAmount">Custom Amount:</label>
        <input type="number" v-model="customAmount" placeholder="Enter custom amount" />
      </div>
      <button @click="buyCoin(coin)">Buy</button>
      <button @click="sellCoin(coin)">Sell</button>
    </div>
  </div>
</template>

<style scoped>
canvas {
  max-width: 100%;
  height: auto;
}
</style>