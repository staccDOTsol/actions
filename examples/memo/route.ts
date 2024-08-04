import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';

// @ts-ignore
import IPFS from 'ipfs-infura';

import multer from 'multer';
import {
  PublicKey,
  Connection,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Keypair,
} from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { actionSpecOpenApiPostRequestBody, actionsSpecOpenApiGetResponse, actionsSpecOpenApiPostResponse } from '../openapi';
import { ActionGetResponse, ActionPostRequest } from '@solana/actions';


const INFURA_PROJECT_ID = '2EByikFMemfaj5nyIsS746PHOc9';
const INFURA_PROJECT_SECRET = 'be67c05e05ec8213134a246fc71f72db';

const auth = 'Basic ' + Buffer.from(INFURA_PROJECT_ID + ':' + INFURA_PROJECT_SECRET).toString('base64');
const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  projectId: INFURA_PROJECT_ID,
  projectSecret: INFURA_PROJECT_SECRET,
});


const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
const UPLOAD_COST = 5 * LAMPORTS_PER_SOL;  // 5 SOL tokens

const rewardPot = Keypair.generate();
const rewardPotPublicKey = rewardPot.publicKey;

const app = new OpenAPIHono();

interface Video {
  id: string;
  ipfsHash: string;
  uploader: string;
  views: number;
  replays: number;
  upvotes: number;
}

const videos: Video[] = [];

import ytdl from 'ytdl-core';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

async function downloadYouTubeVideo(href: string): Promise<string> {
  const videoPath = `./downloads/${Date.now()}.mp4`;
  const videoStream = ytdl(href, { quality: 'highestvideo' });
  const writeStream = fs.createWriteStream(videoPath);

  return new Promise((resolve, reject) => {
    videoStream.pipe(writeStream);
    writeStream.on('finish', () => resolve(videoPath));
    writeStream.on('error', reject);
  });
}

async function transcribeWithWhisper(videoPath: string): Promise<string> {
  const transcriptionPath = `${videoPath}.txt`;
  const command = `whisper ${videoPath} --output ${transcriptionPath}`;
  await execPromise(command);
  return fs.readFileSync(transcriptionPath, 'utf-8');
}

async function createSubtitledGif(videoPath: string, transcription: string): Promise<string> {
  const gifPath = `${videoPath}.gif`;
  const command = `ffmpeg -i ${videoPath} -vf "subtitles=${transcription}" ${gifPath}`;
  await execPromise(command);
  return gifPath;
}


app.openapi(
  createRoute({
    method: 'post',
    path: '/process-youtube/{href}',
    tags: ['Video'],
    request: {
      params: z.object({
        href: z.string(),
      }),
      body: actionSpecOpenApiPostRequestBody,
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    const { account } = (await c.req.json()) as ActionPostRequest;
    const href = c.req.param('href');

    if (!href || !account) {
      return c.json({ error: 'No YouTube URL or account provided.' }, 400);
    }

    const uploaderPubKey = new PublicKey(account);

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: uploaderPubKey,
          toPubkey: rewardPotPublicKey,
          lamports: UPLOAD_COST,
        })
      );

      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
      });

      // Download video from YouTube
      const videoPath = await downloadYouTubeVideo(href);

      // Transcribe video using OpenAI Whisper
      const transcription = await transcribeWithWhisper(videoPath);

      // Add subtitles and split into GIF
      const gifPath = await createSubtitledGif(videoPath, transcription);

      // Upload GIF to IPFS
      const { cid: ipfsHash } = await ipfs.add(fs.readFileSync(gifPath));

      // Clean up temporary files
      fs.unlinkSync(videoPath);
      fs.unlinkSync(gifPath);

      const video: Video = {
        id: Date.now().toString(), // Using timestamp as a simple unique ID
        ipfsHash: ipfsHash.toString(),
        uploader: account,
        views: 0,
        replays: 0,
        upvotes: 0,
      };
      videos.push(video);

      return c.json({
        transaction: Buffer.from(serializedTransaction).toString('base64'),
        message: `Processed YouTube URL and prepared transaction. IPFS Hash: ${ipfsHash}`,
      }, 200);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  }
);
app.openapi(
  createRoute({
    method: 'get',
    path: '/random',
    tags: ['Video'],
    responses: actionsSpecOpenApiGetResponse,
  }),
  (c) => {
    if (videos.length === 0) {
      return c.json({ error: 'No videos available' }, 404);
    }

    const randomIndex = Math.floor(Math.random() * videos.length);
    const randomVideo = videos[randomIndex];
    const response: ActionGetResponse = {
      icon: `https://ipfs.io/ipfs/${randomVideo.ipfsHash}`,
      label: `Watch: ${randomVideo.id}`,
      title: 'Random Video',
      description: `IPFS Hash: ${randomVideo.ipfsHash}`,
      links: {
        actions: [
          {
            label: 'Replay',
            href: `/replay/${randomVideo.id}`,
          },
          {
            label: 'Upvote',
            href: `/upvote/${randomVideo.id}`,
          },
        ],
      },
    };

    return c.json(response, 200);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/view/:id',
    tags: ['Video'],
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  (c) => {
    const { id } = c.req.param();
    const video = videos.find(v => v.id === id);
    if (video) {
      video.views += 1;
      return c.json({ message: 'View recorded' }, 200);
    }
    return c.json({ error: 'Video not found' }, 404);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/replay/:id',
    tags: ['Video'],
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  (c) => {
    const { id } = c.req.param();
    const video = videos.find(v => v.id === id);
    if (video) {
      video.replays += 1;
      return c.json({ message: 'Replay recorded' }, 200);
    }
    return c.json({ error: 'Video not found' }, 404);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/upvote/:id',
    tags: ['Video'],
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
  (c) => {
    const { id } = c.req.param();
    const video = videos.find(v => v.id === id);
    if (video) {
      video.upvotes += 1;
      return c.json({ message: 'Upvote recorded' }, 200);
    }
    return c.json({ error: 'Video not found' }, 404);
  },
);

app.openapi(
  createRoute({
    method: 'post',
    path: '/distribute-rewards',
    tags: ['Video'],
    responses: actionsSpecOpenApiPostResponse,
  }),
  async (c) => {
    if (videos.length === 0) {
      return c.json({ message: 'No videos to distribute rewards to.' }, 400);
    }

    const bestVideo = videos.reduce((max, video) => (calculateScore(video) > calculateScore(max) ? video : max), videos[0]);
    const bestVideoUploaderPubKey = new PublicKey(bestVideo.uploader);

    const potBalance = await connection.getBalance(rewardPotPublicKey);
    if (potBalance <= 0) {
      return c.json({ message: 'No rewards to distribute.' }, 400);
    }

    const rewardTransaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: rewardPotPublicKey,
        toPubkey: bestVideoUploaderPubKey,
        lamports: potBalance,
      })
    );

    try {
      const signature = await connection.sendTransaction(rewardTransaction, [rewardPot]);
      await connection.confirmTransaction(signature, 'confirmed');
      return c.json({ message: `Rewards distributed to video ID: ${bestVideo.id}` }, 200);
    } catch (error:any) {
      return c.json({ error: error.message }, 500);
    }
  }
);


function calculateScore(video: Video): number {
  const viewWeight = 1;
  const replayWeight = 2;
  const upvoteWeight = 5;
  return (video.views * viewWeight) + (video.replays * replayWeight) + (video.upvotes * upvoteWeight);
}


export default app;
