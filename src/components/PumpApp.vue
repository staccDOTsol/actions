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
import { CanvasClient, CanvasInterface } from '@dscvr-one/canvas-client-sdk'; // Import the DSCVR SDK
import { validateHostMessage } from '@/api/dscvr';

const userPublicKey = ref<string | null>(null);
const canvasClient = ref<CanvasClient | null>(null);

const authenticateUser = async () => {
  try {
    const c = new CanvasClient();
    // Save a reference to the CanvasClient instance
    canvasClient.value = c;
const response = await c.ready();

if (response) {
    const user = response.untrusted.user;
    console.log('User Info:', user);
}
  } catch (error) {
    console.error('Failed to authenticate user:', error);
  }
};
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
const chartList = ref<Coin[]>([]);
const errorMessage = ref('');
const successMessage = ref('');
interface Coin {
  mint: string;
  name: string;
  symbol: string;
  price: number;
  image_uri: string;
  description: string;
  marketCap: number;
  volume24h: number;
  score: number;
  candlestickData?: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

const amount = ref(0.1);
const customAmount = ref(null);
const connection = new Connection('https://rpc.ironforge.network/mainnet?apiKey=01HRZ9G6Z2A19FY8PR4RF4J4PW');
const feeRecipient = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");
const global = new PublicKey("4wTV1YmiEkRvAtNtsSGPtUrqRYQMe5SKy2uB4Jjaxnjf");
// @ts-ignore
const provider = new AnchorProvider(connection);
const program = new Program(idl as Idl, new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"), provider);


// Function to fetch the King of the Hill Pump.fun coin
const getKingOfTheHillCoin = async () => {
  const response = await fetch('https://blink.blinkflip.fun/heehee.json');
  const data = await response.json();
  return data;
};
const getTop4Coins = async () => {
  try {
    const response = await fetch('https://blink.blinkflip.fun/heehee.json');
    const data = await response.json();
    return data.slice(0, 4); // Get only the top 4 coins
  } catch (error) {
    console.error('Error fetching top 4 coins:', error);
    return [];
  }
};

const fetchKothCoins = async () => {
  try {
    const top4Coins = await getTop4Coins();
    chartList.value = top4Coins
      .filter((coin: any) => coin.score != null) // Filter out coins with null or undefined score
      .map((coin: any) => ({
        ...coin,
        displayScore: coin.score.toFixed(2) // Format score to 2 decimal places
      }));
  } catch (error: any) {
    errorMessage.value = 'Failed to fetch King of the Hill coin data: ' + error.message;
  }
};

// Replace fetchKothCoin with fetchKothCoins in onMounted
onMounted(() => {
  fetchKothCoins();
  setInterval(fetchKothCoins, 1000); // Fetch new data every minute
});


const emit = defineEmits<{
  (e: 'success', signedTx: string): void;
}>();


// Remove the getCandlestickData function call since it doesn't exist
const fetchKothCoin = async () => {
  try {
    const newCoin = await getKingOfTheHillCoin();
    const existingCoin = chartList.value.find(coin => coin.mint === newCoin.mint);
    if (!existingCoin) {
      chartList.value.unshift({ ...newCoin } as Coin);    
    }
  } catch (error:any) {
    errorMessage.value = 'Failed to fetch King of the Hill coin data: ' + error.message;
  }
};

const buyCoin = async (coin: any, customAmount?: number) => {
    let amountToBuy = customAmount ?? amount.value;
    // Calculate the price for the amount to buy
    const calculatePrice = (outputAmount: number, virtualSolReserves: number, virtualTokenReserves: number): number => {
      return (outputAmount * virtualSolReserves) / (virtualTokenReserves - outputAmount);
    };

      // Get reserves from the coin object
      const virtualSolReserves = coin.virtual_sol_reserves;
      const virtualTokenReserves = coin.virtual_token_reserves;
      
      if (!virtualSolReserves || !virtualTokenReserves) {
        throw new Error('Missing reserve information for the coin');
      }

      // Convert amountToBuy to the same unit as virtualTokenReserves (assuming it's in the smallest unit)
      const outputAmount = amountToBuy * 1e9; // Assuming amountToBuy is in SOL, convert to lamports
      
      const price = calculatePrice(outputAmount, virtualSolReserves, virtualTokenReserves);
      console.log(`Estimated price for ${amountToBuy} tokens: ${price / 1e9} SOL`); // Convert back to SOL for display
      amountToBuy = price
      // You might want to show this price to the user or use it in further calculations
      // If you need to store this in a reactive variable, make sure it's defined in your setup() or data()
      // For example: const estimatedPrice = ref(0);
      // estimatedPrice.value = price / 1e9;
 
    const createTx = async (
      response: CanvasInterface.User.ConnectWalletResponseMessage
    ): Promise<CanvasInterface.User.UnsignedTransaction | undefined> => {
      const isValidResponse = await validateHostMessage(response);
      if (!isValidResponse) {
        errorMessage.value = 'Security error';
        return;
      }

      if (!response.untrusted.success) {
        errorMessage.value = 'Failed to connect wallet';
        return;
      }

      const userPublicKey = new PublicKey(response.untrusted.address);
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
      const transaction = await program.methods.buy(new BN(amountToBu), new BN(Number.MAX_SAFE_INTEGER)).accounts({
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
      
      return {
        unsignedTx: bs58.encode(serializedTransaction)
      };
    };
    // @ts-ignore
    const response = await canvasClient.value.connectWalletAndSendTransaction(
      'solana:101',
      createTx
    );

    if (!response) {
      errorMessage.value = 'Transaction not executed';
      return;
    }

    const isValidResponse = await validateHostMessage(response);
    if (!isValidResponse) {
      errorMessage.value = 'Security error';
      return;
    }

    if (response.untrusted.success) {
      successMessage.value = 'Transaction successful!';
      emit('success', response.untrusted.signedTx);
    } else if (response.untrusted.errorReason === 'user-cancelled') {
      errorMessage.value = 'User cancelled transaction';
    } else {
      errorMessage.value = response?.untrusted.error as string;
    }
};

const sellCoin = async (coin: any, customAmount?: number) => {
    const amountToSell = customAmount ?? amount.value;
    
    // Calculate the amount of SOL to receive for the tokens being sold
    const calculateSolToReceive = (tokenAmount: number, virtualSolReserves: number, virtualTokenReserves: number): number => {
      return (tokenAmount * virtualSolReserves) / (virtualTokenReserves + tokenAmount);
    };

    // Get reserves from the coin object
    const virtualSolReserves = coin.virtual_sol_reserves;
    const virtualTokenReserves = coin.virtual_token_reserves;

    if (!virtualSolReserves || !virtualTokenReserves) {
      throw new Error('Missing reserve information for the coin');
    }

    // Convert amountToSell to the same unit as virtualTokenReserves (assuming it's in the smallest unit)
    const tokenAmount = amountToSell * 1e9; // Assuming amountToSell is in tokens, convert to smallest unit

    const solToReceive = calculateSolToReceive(tokenAmount, virtualSolReserves, virtualTokenReserves);
    console.log(`Estimated SOL to receive for ${amountToSell} tokens: ${solToReceive / 1e9} SOL`); // Convert back to SOL for display

    // You might want to show this amount to the user or use it in further calculations
    // If you need to store this in a reactive variable, make sure it's defined in your setup() or data()
    // For example: const estimatedSolToReceive = ref(0);
    // estimatedSolToReceive.value = solToReceive / 1e9;
    const createTx = async (
      response: CanvasInterface.User.ConnectWalletResponseMessage
    ): Promise<CanvasInterface.User.UnsignedTransaction | undefined> => {
      const isValidResponse = await validateHostMessage(response);
      if (!isValidResponse) {
        errorMessage.value = 'Security error';
        return;
      }

      if (!response.untrusted.success) {
        errorMessage.value = 'Failed to connect wallet';
        return;
      }

      const userPublicKey = new PublicKey(response.untrusted.address);
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
      const transaction = await program.methods.sell(new BN(solToReceive), new BN(0)).accounts({
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
      
      return {
        unsignedTx: bs58.encode(serializedTransaction)
      };
    };
    // @ts-ignore
    const response = await canvasClient.value.connectWalletAndSendTransaction(
      'solana:101',
      createTx
    );

    if (!response) {
      errorMessage.value = 'Transaction not executed';
      return;
    }

    const isValidResponse = await validateHostMessage(response);
    if (!isValidResponse) {
      errorMessage.value = 'Security error';
      return;
    }

    if (response.untrusted.success) {
      successMessage.value = 'Transaction successful!';
      emit('success', response.untrusted.signedTx);
    } else if (response.untrusted.errorReason === 'user-cancelled') {
      errorMessage.value = 'User cancelled transaction';
    } else {
      errorMessage.value = response?.untrusted.error as string;
    }
};

onMounted(() => {
  authenticateUser(); // Authenticate the user when the component is mounted

  fetchKothCoin();
  setInterval(fetchKothCoin, 1000); // Fetch new data every minute
});
</script>
<template>
  <div>
    <div v-if="errorMessage" class="text-red-500">{{ errorMessage }}</div>
    <div v-if="successMessage" class="text-green-500">{{ successMessage }}</div>
    <div v-if="chartList && chartList.length > 0" class="grid grid-cols-2 gap-4">
      <div v-for="coin in chartList.slice(1, 5)" :key="coin.mint" class="p-4 border rounded">
        <img :src="coin.image_uri" :alt="coin.name" class="w-16 h-16 mx-auto">
        <h2 class="text-xl font-bold text-center">{{ coin.symbol }}</h2>
        <p class="text-sm text-center">{{ coin.name }}</p>
        <p class="text-2xl font-bold text-center text-green-600">Rate of change of price / minute: {{ coin.score.toFixed(2) }}%</p>
        <p class="text-xs text-center mt-2">{{ coin.description }}</p>
        <canvas :ref="'chartCanvas' + coin.mint" class="mt-4"></canvas>
        <div class="mt-4 flex flex-wrap justify-between">
          <button @click="buyCoin(coin, 0.1)" class="px-4 py-2 bg-green-500 text-white rounded mb-2">Buy 0.1</button>
          <button @click="buyCoin(coin, 1)" class="px-4 py-2 bg-green-500 text-white rounded mb-2">Buy 1</button>
          <button @click="buyCoin(coin, 5)" class="px-4 py-2 bg-green-500 text-white rounded mb-2">Buy 5</button>
          <button @click="sellCoin(coin, 0.1)" class="px-4 py-2 bg-red-500 text-white rounded mb-2">Sell 0.1</button>
          <button @click="sellCoin(coin, 1)" class="px-4 py-2 bg-red-500 text-white rounded mb-2">Sell 1</button>
          <button @click="sellCoin(coin, 5)" class="px-4 py-2 bg-red-500 text-white rounded mb-2">Sell 5</button>
        </div>
        <div class="mt-2">
          <label for="customAmount" class="block mb-1">Custom Amount:</label>
          <input type="number" v-model="customAmount" placeholder="Enter custom amount" class="w-full p-2 border rounded mb-2" />
          <div class="flex justify-between">
            <button @click="buyCoin(coin, Number(customAmount))" class="px-4 py-2 bg-green-500 text-white rounded">Buy Custom</button>
            <button @click="sellCoin(coin, Number(customAmount))" class="px-4 py-2 bg-red-500 text-white rounded">Sell Custom</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-center mt-4">
      <p>No coins available at the moment. Please try again later.</p>
    </div>
  </div>
</template>