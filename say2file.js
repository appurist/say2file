const fs = require('fs');

const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

// read .env and .env.defaults
require('dotenv-defaults/config');

const IBMKEY = process.env.hasOwnProperty("IBMKEY") ? process.env["IBMKEY"] : null;
const IBMURL = process.env.hasOwnProperty("IBMURL") ? process.env["IBMURL"] : null;

const textToSpeech = new TextToSpeechV1({
  authenticator: new IamAuthenticator({ apikey: IBMKEY }),
  serviceUrl: IBMURL
});

let args = process.argv.slice(1);
if (args[0]?.endsWith('.js'))
  args = args.slice(1);

let line = args.join(' ');
console.log(`Args: '${line}'`);

const params = {
  text: line,
  voice: 'en-US_MichaelV3Voice', // Optional voice
  accept: 'audio/wav'
};

// Synthesize speech, correct the wav header, then save to disk
// (wav header requires a file length, but this is unknown until after the header is already generated and sent)
// note that `repairWavHeaderStream` will read the whole stream into memory in order to process it.
// the method returns a Promise that resolves with the repaired buffer
textToSpeech
  .synthesize(params)
  .then(response => {
    const audio = response.result;
    return textToSpeech.repairWavHeaderStream(audio);
  })
  .then(repairedFile => {
    fs.writeFileSync('audio.wav', repairedFile);
    console.log('audio.wav written with a corrected wav header');
  })
  .catch(err => {
    console.log(err);
  });


// or, using WebSockets
//textToSpeech.synthesizeUsingWebSocket(params);
// synthStream.pipe(fs.createWriteStream('./audio.ogg'));
// see more information in examples/text_to_speech_websocket.js