import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { ChartConfiguration } from 'chart.js';
import { Buffer } from 'buffer';
import IPFS from 'ipfs-infura';
import imgur from 'imgur';
import fetch from 'node-fetch';

const projectId = '2XjChM8WMK9UTvZENIfZH9ggTup';
const projectSecret = 'f3e62c0c6f31a87388b3806d71ed7682';
const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');

const ipfs = new IPFS({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  projectId,
  projectSecret
});

export const uploadImageToIPFS = async (image: string) => {
  try {
    const path = await ipfs.add(Buffer.from(image, 'base64'));
    const gatewayLink = `https://stacc.infura-ipfs.io/ipfs/${path}`;
    console.log('IPFS link:', gatewayLink);
    return gatewayLink;
  } catch (error) {
    console.error('Error uploading image to IPFS:', error);
    throw error;
  }
};

const Imgur = new imgur({
  clientId: '06f787d29bb77bf',
  clientSecret: 'f2966431bf8f496742a06d6ed36431c31a760f0e'
});

export const uploadImageToImgur = async (image: string) => {
  try {
    const response = await Imgur.upload({
      image,
      type: "base64"
    });
    console.log(response.data);
    return response.data.link;
  } catch (error) {
    console.error('Error uploading image to Imgur:', error);
    throw error;
  }
};

export const getCandlestickData = async (mint: string) => {
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