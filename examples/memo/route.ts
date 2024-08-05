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
const INFURA_PROJECT_SECRET = '';

const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  projectId: INFURA_PROJECT_ID,
  projectSecret: INFURA_PROJECT_SECRET,
});


const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
const UPLOAD_COST = 0.035719388*LAMPORTS_PER_SOL//5 * LAMPORTS_PER_SOL;  // 5 SOL tokens

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
  console.log(href);

  return new Promise((resolve, reject) => {
    const videoPath = `./${Date.now()}.mp4`;

    const audioPath = `./${Date.now()}.mp3`;

    const videoProcess = exec(`yt-dlp -f 'bestvideo[ext=mp4]' -o "${videoPath}" ${href}`);
    // Check if the audio output is in m4a format
    const audioProcess = exec(`yt-dlp -x --audio-format mp3 -o "${audioPath}" ${href}`);

    // Add error handling for the processes
    [videoProcess, audioProcess].forEach(process => {
      process.on('error', (error) => {
        console.error(`Process error: ${error.message}`);
        reject(error);
      });
    });
    [videoProcess, audioProcess].forEach(process => {
      // @ts-ignore
      process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      // @ts-ignore
      process.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
    });

    let completedProcesses = 0;
    [videoProcess, audioProcess].forEach(process => {
      process.on('close', (code) => {
        if (code === 0) {
          completedProcesses++;
          if (completedProcesses === 2) {
            resolve(videoPath.replace('.mp4', ''))
          }
        } else {
          reject(new Error(`yt-dlp process exited with code ${code}`));
        }
      });
    });
  });
}
async function transcribeWithWhisper(ts: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const transcriptionPath = `${ts}.txt`;
    console.log(`transcriptionPath: ${transcriptionPath}`);
    const whisperCommand = `whisper ${ts}.mp3 --output_dir ${path.dirname(transcriptionPath)} --model small`;
    
    const whisperProcess = exec(whisperCommand);

    whisperProcess.stdout?.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    whisperProcess.stderr?.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    whisperProcess.on('close', (whisperCode) => {
      if (whisperCode === 0) {
        const fullTranscriptionPath = path.join(path.dirname(transcriptionPath), `${path.basename(transcriptionPath, '.txt')}.txt`);
        fs.readFile(fullTranscriptionPath, 'utf-8', (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      } else {
        // Check for specific error related to ffmpeg
        if (whisperProcess.stderr && whisperProcess.stderr.toString().includes("Failed to load audio")) {
          reject(new Error("Failed to load audio. Please check if ffmpeg is installed and the video file is valid."));
        } else {
          reject(new Error(`Whisper process exited with code ${whisperCode}`));
        }
      }
    });
  });
}
  import { spawn } from 'child_process';
  async function createSubtitledGif(videoPath: string, transcription: string): Promise<string> {
    const gifPath = `${videoPath}.gif`;
  
    fs.writeFileSync(`${videoPath}.srt`, formatTranscriptionToSRT(transcription));
    const ffmpegCommand = [
      'ffmpeg',
      '-i', videoPath,
      '-vf', `subtitles=${videoPath}.srt:force_style='Fontsize=24,Alignment=10',scale=320:-1`,  // Combine filters
      '-r', '10',  // Reduce frame rate for smaller file size
      '-t', '10',  // Limit to first 10 seconds
      gifPath
    ];
    console.log(ffmpegCommand);
    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegCommand[0], ffmpegCommand.slice(1));
  
      ffmpegProcess.stdout.on('data', (data) => {
        console.log(`ffmpeg stdout: ${data}`);
      });
  
      ffmpegProcess.stderr.on('data', (data) => {
        console.error(`ffmpeg stderr: ${data}`);
      });
  
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve(gifPath);
        } else {
          reject(new Error(`ffmpeg process exited with code ${code}`));
        }
      });
    });
  }
function formatTranscriptionToSRT(transcription: string): string {
  // Simple SRT formatting, assuming one line per subtitle
  return transcription.split('\n').map((line, index) => {
    const startTime = formatSRTTime(index * 2);
    const endTime = formatSRTTime(index * 2 + 2);
    return `${index + 1}\n${startTime} --> ${endTime}\n${line}\n`;
  }).join('\n');
}

function formatSRTTime(seconds: number): string {
  const pad = (num: number) => num.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(hours)}:${pad(minutes)}:${pad(secs)},${ms.toString().padStart(3, '0')}`;
}


app.openapi(
  createRoute({
    method: 'post',
    path: '/upload/{href}',
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
transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
transaction.feePayer = uploaderPubKey
      const serializedTransaction = transaction.serialize({
        requireAllSignatures: false,
      });

      // Download video from YouTube
      const ts = await downloadYouTubeVideo(href);

      // Transcribe video using OpenAI Whisper
      const transcription = await transcribeWithWhisper(ts);

      // Add subtitles and split into GIF
      const gifPath = await createSubtitledGif(ts+'.mp4', transcription);
      // Upload GIF to IPFS
      const ipfsHash = await ipfs.add(fs.readFileSync(gifPath));
      

      const video: Video = {
        id: Date.now().toString(), // Using timestamp as a simple unique ID
        ipfsHash: gifPath,
        uploader: account,
        views: 0,
        replays: 0,
        upvotes: 0,
      };
      videos.push(video);

      return c.json({
        transaction: Buffer.from(serializedTransaction).toString('base64'),
        message: `Processed YouTube URL pay the pied piper and share http://localhost/${video.id}`,
      }, 200);
    } catch (error) {
      return c.json({ error: (error as Error).message }, 500);
    }
  }
);
// you will want to run a transaction checker on a loop to see if tx are successful for th eright amount by the right party then invalidate ppl who don't pay the pied piper
app.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Video'],
    responses: actionsSpecOpenApiGetResponse,
  }),
  (c) => {
    const id = c.req.param('id');
    const video = videos.find(v => v.id === id);
    // Log the view
    console.log(`Video ${id} viewed`);

    // Post the view to the server
    fetch(`/view/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timestamp: new Date().toISOString() }),
    }).catch(error => console.error('Error posting view:', error));

    if (!video) {
      return c.json({ error: 'Video not found' }, 404);
    }

    // Increment views
    video.views += 1;

    const response: ActionGetResponse = {
      icon: `data:image/gif;base64,${fs.readFileSync(video.ipfsHash).toString('base64')}`,
      label: `Watch: ${video.id}`,
      title: `Video ${video.id}`,
      description: `Don't like it? Refresh! Views: ${video.views} Upvotes: ${video.upvotes}`,
      links: {
        actions: [
          {
            label: 'Upvote',
            href: `/upvote/${video.id}`,
          }
        ],
      },
    };

    return c.json(response, 200);
  }
);
app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Video'],
    responses: actionsSpecOpenApiGetResponse,
  }),
  (c) => {
    if (videos.length === 0) {
      const response: ActionGetResponse = {
        icon: 'https://example.com/upload-icon.png',
        label: 'Upload YouTube Short',
        title: 'Upload a new video',
        description: 'Paste a YouTube Short URL to upload. this will take a really long time cuz it downloads ur video, transcribes it, adds subtitles, magick, plz be patient',
        links: {
          actions: [
            {
              href: '/upload/{href}',
              label: 'Upload YouTube Short',
              parameters: [
                {
                  name: 'href',
                  label: 'YouTube Short URL',
                },
              ],
            },
          ],
        },
      };
      return c.json(response, 200);
    }
    console.log(videos);
    
    // Calculate total upvotes
    const totalUpvotes = videos.reduce((sum, video) => sum + video.upvotes, 0);
    
    // Calculate weighted probabilities based on upvotes
    const weightedProbabilities = videos.map(video => 
      (video.upvotes / totalUpvotes) + (Math.random() * 0.1) // Add small random factor
    );
    
    // Normalize probabilities
    const sumProbabilities = weightedProbabilities.reduce((sum, prob) => sum + prob, 0);
    const normalizedProbabilities = weightedProbabilities.map(prob => prob / sumProbabilities);
    
    // Choose random video based on weighted probabilities
    let randomValue = Math.random();
    let chosenIndex = 0;
    for (let i = 0; i < normalizedProbabilities.length; i++) {
      randomValue -= normalizedProbabilities[i];
      if (randomValue <= 0) {
        chosenIndex = i;
        break;
      }
    }
    
    const randomVideo = videos[chosenIndex];
    const id = randomVideo.id;
    console.log(`Video ${id} viewed`);

    // Post the view to the server
    fetch(`/view/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ timestamp: new Date().toISOString() }),
    }).catch(error => console.error('Error posting view:', error));

    const response: ActionGetResponse = {
      icon: `data:image/gif;base64,${fs.readFileSync(randomVideo.ipfsHash).toString('base64')}`,
      label: `Watch: ${randomVideo.id}`,
      title: 'Featured Video',
      description: `Don't like it? Refresh! Views: ${randomVideo.views} Upvotes: ${randomVideo.upvotes}`,
      links: {
        actions: [
          {
            label: 'Upvote',
            href: `/upvote/${randomVideo.id}`,
          },
          {
            href: '/upload/{href}',
            label: 'Upload YouTube Short',
            parameters: [
              {
                name: 'href',
                label: 'YouTube Short URL',
              },
            ],
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
    path: '/view/{id}',
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
    path: '/replay/{id}',
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
    path: '/upvote/{id}',
    tags: ['Video'],
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: actionsSpecOpenApiPostResponse,
  }),
 async (c) => {
    const { id } = c.req.param();
    const video = videos.find(v => v.id === id);
    const { account } = (await c.req.json()) as ActionPostRequest;
    if (video) {
      video.upvotes += 1;
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(account),
          toPubkey: rewardPotPublicKey,
          lamports: 100000, // 0.001 SOL as an example upvote reward
        })
      )

transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
transaction.feePayer = new PublicKey(account)
      return c.json({ 
        transaction: Buffer.from(transaction.serialize({requireAllSignatures: false})).toString('base64'),
        message: 'Upvote recorded' }, 200);
    }
    return c.json({ error: 'Video not found' }, 404);
  },
);
// @ts-ignore
import cron from 'node-cron';

async function distributeRewards(c?: any) {
  if (videos.length === 0) {
    if (c) return c.json({ message: 'No videos to distribute rewards to.' }, 400);
    return;
  }

  const bestVideo = videos.reduce((max, video) => (calculateScore(video) > calculateScore(max) ? video : max), videos[0]);
  const bestVideoUploaderPubKey = new PublicKey(bestVideo.uploader);

  const potBalance = await connection.getBalance(rewardPotPublicKey);
  if (potBalance <= 0) {
    if (c) return c.json({ message: 'No rewards to distribute.' }, 400);
    return;
  }

  const rewardTransaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: rewardPotPublicKey,
      toPubkey: bestVideoUploaderPubKey,
      lamports: potBalance,
    })
  );
  rewardTransaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
  rewardTransaction.feePayer = rewardPotPublicKey
  try {
    const signature = await connection.sendTransaction(rewardTransaction, [rewardPot]);
    await connection.confirmTransaction(signature, 'confirmed');
    if (c) return c.json({ message: `Rewards distributed to video ID: ${bestVideo.id}` }, 200);
  } catch (error: any) {
    if (c) return c.json({ error: error.message }, 500);
  }
}

// Schedule the reward distribution to run once an hour
cron.schedule('0 * * * *', distributeRewards);

// ... exist


function calculateScore(video: Video): number {
  const viewWeight = 1;
  const replayWeight = 2;
  const upvoteWeight = 5;
  return (video.views * viewWeight) + (video.replays * replayWeight) + (video.upvotes * upvoteWeight);
}


export default app;
