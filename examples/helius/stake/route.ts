import { LST, LstList } from 'sanctum-lst-list';
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { ActionError, ActionGetResponse, ActionPostRequest, ActionPostResponse } from '@solana/actions';
import jupiterApi from '../../../api/jupiter-api';
import {
  actionSpecOpenApiPostRequestBody,
  actionsSpecOpenApiGetResponse,
  actionsSpecOpenApiPostResponse,
} from '../../openapi';

const HELIUS_ACTION_ICON =
  'https://ucarecdn.com/bb8f075a-5e6e-4b5b-ba90-8140c020e3e2/-/preview/880x880/-/quality/smart/-/format/auto/';
const SWAP_AMOUNT_SOL_OPTIONS = [1, 5, 10];
const DEFAULT_SWAP_AMOUNT_SOL = 1;

const app = new OpenAPIHono();

app.openapi(createRoute({
  method: 'get',
  path: '/',
  tags: ['Helius Stake'],
  responses: actionsSpecOpenApiGetResponse,
}), (c:any) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Upload Platform</title>
  <script src="https://cdn.jsdelivr.net/npm/@solana/web3.js@1.28.0/lib/index.iife.min.js"></script>
</head>
<body>
  <h1>Video Upload Platform</h1>
  <form id="upload-form">
    <input type="file" id="video-file" accept="video/*" required>
    <button type="button" onclick="uploadVideo()">Upload Video</button>
  </form>
  <script>
    const connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl('devnet'));

    async function uploadVideo() {
      const fileInput = document.getElementById('video-file');
      if (!fileInput.files.length) return alert('Please select a video file.');

      const videoFile = fileInput.files[0];
      const reader = new FileReader();
      reader.readAsArrayBuffer(videoFile);

      reader.onload = async () => {
        const account = await window.solana.connect();
        const publicKey = account.publicKey.toString();
        
        // Create a form data object
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('account', publicKey);

        // Send the video and account details to the backend
        const response = await fetch('/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (result.error) {
          alert('Error: ' + result.error);
        } else {
          // Sign the transaction with the user's wallet
          const transaction = solanaWeb3.Transaction.from(Buffer.from(result.transaction, 'base64'));
          const signed = await window.solana.signTransaction(transaction);
          const signature = await connection.sendRawTransaction(signed.serialize());
          await connection.confirmTransaction(signature);

          alert('Video uploaded successfully. Transaction signature: ' + signature);
        }
      };
    }

    // Connect to the wallet on page load
    window.onload = async () => {
      if (window.solana) {
        await window.solana.connect();
      } else {
        alert('Please install a Solana wallet like Phantom.');
      }
    };
  </script>
</body>
</html>`)});

export default app;
