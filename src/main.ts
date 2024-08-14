import './assets/main.css';
import { createApp } from 'vue';
import App from './App.vue';
import { Buffer } from 'buffer';

// Polyfill Buffer for the browser environment
window.Buffer = Buffer;

createApp(App).mount('#app');
