const { Readable } = require('node:stream');

/**
 * Fetch-based IBM Watson Text-to-Speech implementation
 * Replaces the official ibm-watson SDK to eliminate axios dependency
 */

class IamAuthenticator {
  constructor({ apikey }) {
    this.apikey = apikey;
  }

  async authenticate() {
    // IBM Watson uses API key directly in Authorization header
    return `Basic ${Buffer.from(`apikey:${this.apikey}`).toString('base64')}`;
  }
}

class TextToSpeechV1 {
  constructor({ authenticator, serviceUrl }) {
    this.authenticator = authenticator;
    this.serviceUrl = serviceUrl;
  }

  async synthesize(options) {
    try {
      const authHeader = await this.authenticator.authenticate();
      
      const headers = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': options.accept || 'audio/wav'
      };

      const body = {
        text: options.text,
        voice: options.voice
      };

      const response = await fetch(`${this.serviceUrl}/v1/synthesize`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || response.statusText;
        } catch {
          errorMessage = errorText || response.statusText;
        }
        throw new Error(`IBM Watson API error (${response.status}): ${errorMessage}`);
      }

      // Return the response in the same format as the original SDK
      return {
        result: response.body
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Repair WAV header stream - converts stream to buffer with corrected WAV header
   * This replicates the functionality from the original IBM Watson SDK
   */
  async repairWavHeaderStream(audioStream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      
      const readable = Readable.fromWeb(audioStream);
      
      readable.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      readable.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          
          // Check if it's a WAV file that needs header repair
          if (buffer.length >= 44 && 
              buffer.toString('ascii', 0, 4) === 'RIFF' && 
              buffer.toString('ascii', 8, 12) === 'WAVE') {
            
            // Update the file size in the RIFF header (bytes 4-7)
            const fileSize = buffer.length - 8;
            buffer.writeUInt32LE(fileSize, 4);
            
            // Find the data chunk and update its size
            let dataChunkPos = 12;
            while (dataChunkPos < buffer.length - 8) {
              const chunkId = buffer.toString('ascii', dataChunkPos, dataChunkPos + 4);
              const chunkSize = buffer.readUInt32LE(dataChunkPos + 4);
              
              if (chunkId === 'data') {
                // Update data chunk size
                const dataSize = buffer.length - dataChunkPos - 8;
                buffer.writeUInt32LE(dataSize, dataChunkPos + 4);
                break;
              }
              
              dataChunkPos += 8 + chunkSize;
            }
          }
          
          resolve(buffer);
        } catch (error) {
          reject(error);
        }
      });
      
      readable.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = {
  TextToSpeechV1,
  IamAuthenticator
};
