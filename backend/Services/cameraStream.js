import ffmpeg from 'fluent-ffmpeg';
import WebSocket from 'ws';
import { PassThrough } from 'stream';

class StreamingService {
  constructor() {
    this.streams = new Map();
  }

  startStream(rtspUrl, wsClient) {
    if (this.streams.has(rtspUrl)) {
      const existing = this.streams.get(rtspUrl);
      existing.clients.add(wsClient);
      return existing;
    }

    const clients = new Set([wsClient]);
    const outputStream = new PassThrough();

    const command = ffmpeg(rtspUrl)
      .inputOptions([
        '-rtsp_transport', 'tcp',
        '-stimeout', '5000000'
      ])
      .outputOptions([
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-framerate', '30',
        '-b:v', '800k',
        '-bf', '0',
        '-muxdelay', '0.001'
      ])
      .on('start', (commandLine) => {
        console.log(`Stream started: ${rtspUrl}`);
        console.log(`FFmpeg command: ${commandLine}`);
      })
      .on('error', (err) => {
        console.error(`Stream error (${rtspUrl}):`, err);
        this.stopStream(rtspUrl);
      })
      .on('end', () => {
        console.log(`Stream ended: ${rtspUrl}`);
        this.stopStream(rtspUrl);
      })
      .pipe(outputStream, { end: true });

    this.streams.set(rtspUrl, { command, clients, outputStream });

    return { command, clients, outputStream };
  }

  stopStream(rtspUrl) {
    if (!this.streams.has(rtspUrl)) return;

    const { command, clients } = this.streams.get(rtspUrl);
    clients.forEach(client => client.close());
    command.kill('SIGKILL');
    this.streams.delete(rtspUrl);
  }

  removeClient(rtspUrl, wsClient) {
    if (!this.streams.has(rtspUrl)) return;

    const stream = this.streams.get(rtspUrl);
    stream.clients.delete(wsClient);

    if (stream.clients.size === 0) {
      this.stopStream(rtspUrl);
    }
  }
}

export default new StreamingService();