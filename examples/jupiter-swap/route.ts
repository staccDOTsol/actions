import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../openapi';
import jupiterApi from '../../api/jupiter-api';
import {
  ActionError,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
} from '@solana/actions';
import { PublicKey, Keypair, SystemProgram, Connection, ComputeBudgetProgram, AddressLookupTableAccount, TransactionInstruction, TransactionMessage, VersionedTransaction, Transaction, VersionedMessage } from '@solana/web3.js';
import { createJupiterApiClient, QuoteGetRequest, SwapPostRequest } from '@jup-ag/api';
import fs from 'fs';
import { BN } from '@coral-xyz/anchor';
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { createCollection, createV1, mplCore } from '@metaplex-foundation/mpl-core'
import OpenAI from 'openai';
import { ruleSet } from '@metaplex-foundation/mpl-core'
import { irysUploader } from '@metaplex-foundation/umi-uploader-irys'


import { CompiledAddressLookupTable, generateSigner, keypairIdentity, publicKey } from '@metaplex-foundation/umi'
import { create } from '@metaplex-foundation/mpl-core'

const umi = createUmi(process.env.NEXT_PUBLIC_RPC_URL as string).use(mplCore())
umi.use(irysUploader())

const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL as string);
const providerKeypair = Keypair.fromSecretKey(bs58.decode(process.env.KEY as string))
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(providerKeypair.secretKey))
umi.use(keypairIdentity(keypair))
export const JUPITER_LOGO =
  'https://ucarecdn.com/09c80208-f27c-45dd-b716-75e1e55832c4/-/preview/1000x981/-/quality/smart/-/format/auto/';

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
    path: '/',
    tags: ['Jupiter Swap'],
    responses: actionsSpecOpenApiGetResponse,
  }),
  async (c) => {


    const amountParameterName = 'amount';
    const response: ActionGetResponse = {
      icon: JUPITER_LOGO,
      label: `Analyze my wallet history`,
      title: `Analyze my wallet history`,
      description: `Analyze my wallet history.`,
      links: {
        actions: [
          {
            href: `/`,
            label: `Analyze my wallet history`
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
    tags: ['Jupiter Swap'],
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
    const [inputTokenMeta, outputTokenMeta] = await Promise.all([
      jupiterApi.lookupToken(inputToken),
      jupiterApi.lookupToken(outputToken),
    ]);

    if (!inputTokenMeta || !outputTokenMeta) {
      return Response.json({
        icon: JUPITER_LOGO,
        label: 'Not Available',
        title: `Buy ${outputToken}`,
        description: `Buy ${outputToken} with ${inputToken}.`,
        disabled: true,
        error: {
          message: `Token metadata not found.`,
        },
      } satisfies ActionGetResponse);
    }

    const response: ActionGetResponse = {
      icon: JUPITER_LOGO,
      label: `Buy ${outputTokenMeta.symbol}`,
      title: `Buy ${outputTokenMeta.symbol} with ${inputTokenMeta.symbol}`,
      description: `Buy ${outputTokenMeta.symbol} with ${inputTokenMeta.symbol}.`,
    };

    return c.json(response);
  },
);
const openai = new OpenAI();

app.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Jupiter Swap'],
    request: {
      body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const { account } = (await c.req.json()) as ActionPostRequest;

    let base_url = `https://api.helius.xyz/v0/addresses/${account}/transactions?api-key=79503095-a514-4e8b-b448-2e0ca38e542e&limit=100`;
    let url = base_url;
   
    const fetchAndParseTransactions = async () => {
      let txs: any [] = []
      let lastSignature: string | null = null;

      while (true) {
        if (lastSignature) {
          url = base_url + `&before=${lastSignature}`;
        }
        const response = await fetch(url);
        const transactions = await response.json();

        if (transactions && transactions.length > 0) {
          console.log("Fetched transactions: ", transactions);
          lastSignature = transactions[transactions.length - 1].signature;
          txs.push(...transactions.map((tx: any) => tx.description))
          if (txs.length > 666){
            break;
          }
        } else {
          console.log("No more transactions available.");
          break;
        }
      }
      return txs
    };
const transactions: any = (await    fetchAndParseTransactions()).filter((m)=>m.length > 0);
console.log(transactions)
let done = false 
let tx: VersionedTransaction
while (!done){
  try {
const completion = await openai.chat.completions.create({
  messages: [
      {"role": "system", "content": `You're a personality assessment generat000r based on solana transactions for a wallet. consider the graph of interactions...ok hear me out:

      solana blinks are great for in-feed transactions. so far it’s been used for things like buying whiskey, make a donation, etc. it’s obvious, low-hanging fruit.
      
      but there’s another use case i think could spark a new meta.
      
      remember the personality quiz mania on facebook in the early 2010’s?
      
      you had to answer a set of questions and it would spit out an archetype (i.e. which hogwarts house would you be sorted into).
      
      it felt good to be read and seen, and it felt even better to share the results out to your friends and get their reactions. 
      
      crypto can level up this experience.
      
      instead of answering a bunch of questions you can click a button and the blink scans your holdings/transaction history. 
      
      the things you do and own say more about you than the things you say.
      
      you don’t need to spend any time answering questions and you’ll get a more accurate result.
      
      someone trading political coins on solana would get a different result than someone trading dog and cat memes.
      
      you could repost your results and tribes would form around them the way they used to on facebook.
      
      taking this one step further…
      
      you could also generate a pfp based on the result and give the user the option to mint it. 
      
      unlike the previous 10k pfp meta, instead of randomly generating traits on reveal, the metadata would be generated based on your onchain activity.
      
      identity is the missing piece in the memecoin wave imo. it could be a great way to integrate identity tokens back into the conversation.
     
      user will provide context in the form of human readable tx descriptions.
      BE MIDNFUL YOUR RESPONSE WILL BE FED TO OPENAI DALLE GENERATION AND SO YOU MUST COMPLY WITH YOUR OWN CONTENT RESTRICTIONS.
      BE MIDNFUL YOUR RESPONSE WILL BE FED TO OPENAI DALLE GENERATION AND SO YOU MUST COMPLY WITH YOUR OWN CONTENT RESTRICTIONS.

      BE MIDNFUL YOUR RESPONSE WILL BE FED TO OPENAI DALLE GENERATION AND SO YOU MUST COMPLY WITH YOUR OWN CONTENT RESTRICTIONS.

      BE MIDNFUL YOUR RESPONSE WILL BE FED TO OPENAI DALLE GENERATION AND SO YOU MUST COMPLY WITH YOUR OWN CONTENT RESTRICTIONS.

      PROVIDE ONLY THE DALLE GENERATION PROMPT AFTER YOUR PERSONALITY ASSESSMENT SURROUNDED BY <-> like <->{prompt}<->, prepending always with 'create a personal profile picture for

      PROVIDE ONLY THE DALLE GENERATION PROMPT AFTER YOUR PERSONALITY ASSESSMENT SURROUNDED BY <-> like <->{prompt}<->, prepending always with 'create a personal profile picture for

      PROVIDE ONLY THE DALLE GENERATION PROMPT AFTER YOUR PERSONALITY ASSESSMENT SURROUNDED BY <-> like <->{prompt}<->, prepending always with 'create a personal profile picture for

      PROVIDE ONLY THE DALLE GENERATION PROMPT AFTER YOUR PERSONALITY ASSESSMENT SURROUNDED BY <-> like <->{prompt}<->, prepending always with 'create a personal profile picture for'
      you must include  <->  twice ffs
      but your ppersonality assessment should be lengthy and read like an informed tarot reading...
    `},
    ...transactions.map((transaction: any, index: any) => (
      {"role": "user", "content": transaction}
    )),
    ],
  model: "gpt-4o",
});

console.log(completion.choices[0]);
const response = await openai.images.generate({
  model: "dall-e-3",
  // @ts-ignore
  prompt: completion.choices[0].message.content.match(/<->(.*?)<->/s)?.[1] || '',
  n: 1,
  size: "1024x1024",
});
const image_url = response.data[0].url;
console.log(image_url)

const assetSigner = generateSigner(umi)

const uri = await umi.uploader.uploadJson({
  name: `Personality PFP`,
  description: completion.choices[0].message.content,
  image: image_url,
})

const creators = [
  { address: publicKey(providerKeypair.publicKey), percentage: 20 },
  { address: publicKey(account), percentage: 80 }
]

const rule_set = ruleSet('None')

const created = await create(umi, {
  asset: assetSigner,
  plugins: [{
    type: 'Royalties',
    basisPoints: 500,
    creators,
    ruleSet: rule_set
  }],
  collection: {
    publicKey: publicKey("9YaXsuhCHvSBpzxgxv8Bo8vKaXw36m1nRUckYRLiCct7"),
  },
  name: `Personality PFP`,
  uri: uri,
}).buildAndSign(umi)
const luts: any [] = []
for (const lut of created.message.addressLookupTables){
  const maybe =await connection.getAddressLookupTable(new PublicKey(lut.publicKey))
  if (maybe != undefined){

    luts.push(maybe)
  }
}
const godWhyIsThisSoDifficult = TransactionMessage.decompile(
  VersionedMessage.deserialize(created.serializedMessage),
  {
    addressLookupTableAccounts:luts})


    const messageV0 = new TransactionMessage({
      payerKey: providerKeypair.publicKey,
      recentBlockhash:  created.message.blockhash,
      instructions: [
        ...godWhyIsThisSoDifficult.instructions,
        ComputeBudgetProgram.setComputeUnitPrice({microLamports: 333000}),
        SystemProgram.transfer(
          {
            fromPubkey: new PublicKey(account),
            toPubkey: providerKeypair.publicKey,
            lamports: 0.1 * 10 ** 9
          }
        ),
      ],
    }).compileToV0Message(luts);
    tx = new VersionedTransaction(messageV0);
    tx.sign(  [Keypair.fromSecretKey(assetSigner.secretKey), providerKeypair])
   
done =true 
  }
  catch (err){
    console.log(err)
  }
}

    const response = {
      // @ts-ignore
      transaction: Buffer.from(tx.serialize()).toString('base64')
    };
    return c.json(response);
  },
);

export default app;
