const fs = require('fs');
const arg = require('arg');

const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');

const version = require('./package.json').version;

// read .env and .env.defaults
require('dotenv-defaults/config');

const IBMKEY = process.env.hasOwnProperty("IBMKEY") ? process.env["IBMKEY"] : null;
const IBMURL = process.env.hasOwnProperty("IBMURL") ? process.env["IBMURL"] : null;

function onError(err) {
  console.error("Server error:", err.message);
  process.exit(1);  //mandatory return code (as per the Node.js docs)
}

process.on('uncaughtException', onError);

let args;
try {
  args = arg({
    // Types
    '--key': String,     // --key <string> or --key=<string>
    '--url': String,
    '--file': String,
    '--out': String,
    '--type': String,
    '--rate': Number,
    '--voice': String,
    '--split': Boolean,

    '--help': Boolean,
    '--verbose': Boolean,
    '--version': Boolean,

    // Aliases
    '-k': '--key',
    '-u': '--url',
    '-f': '--file',
    '-o': '--out',
    '-t': '--type',
    '-r': '--rate',
    '-w': '--voice',
    '-s': '--split',
    
    '-v': '--version',
    '-h': '--help',
    '-?': '--help'
  });
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

let fileIn = args['--file'];
let fileOut = args['--out'] || 'audio';
let fileType = args['--type'] || 'wav';
let rate = args['--rate'] || 44100;
let voice = args['--voice'] || 'michael';
let apikey = args['--key'] || IBMKEY;
let apiURL = args['--url'] || IBMURL;
let isSplit = args['--split'] || false;
let line = args._.join(' ').trim();

if (args['--version']) {
  console.log("say2file version "+version);
  process.exit(1);
}
if (args['--help']) {
  console.log("say2file [options] [optional text to convert to audio]");
  console.log("Options: --file or -f with filename (input text file)")
  console.log("         --split or -s (split the input text file into multiple output files)")
  console.log("         --out or -o with rootname (produces rootname.type or rootname-n.type)")
  console.log("         --voice or -w with who (michael olivia kevin lisa allison henry james kate charlotte craig madison)")
  console.log("         --type or -t with type (wav, mp3, mpeg, flac, ogg)")
  console.log("         --rate or -r with rate (sample rate, default is 44100)")
  console.log("         --key or -k with IBM Watson api key to use")
  console.log("         --url or -k with IBM Watson service URL to use")
  console.log("         --version or -v (show version))")
  console.log("         --help or -h or -? (this help))")
  process.exit(1);
}

let lines = [ ];
if (line) {
  lines = [ line ];
} else
if (fileIn) {
  let text = fs.readFileSync(fileIn, {encoding:'utf8', flag:'r'});
  if (isSplit) {
    lines = text.split('\n');
  } else {
    lines = [text];
  }
} else {
  process.exit(0); // no work
}

let fullVoice = voice;
switch (voice.toLowerCase()) {
  case '': fullVoice = 'en-US_MichaelV3Voice'; break;
  case 'michael': fullVoice = 'en-US_MichaelV3Voice'; break;
  case 'olivia': fullVoice = 'en-US_OliviaV3Voice'; break;
  case 'henry': fullVoice = 'en-US_HenryV3Voice'; break;
  case 'allison': fullVoice = 'en-US_AllisonV3Voice'; break;
  case 'kevin': fullVoice = 'en-US_KevinV3Voice'; break;
  case 'lisa': fullVoice = 'en-US_LisaV3Voice'; break;
  case 'emily': fullVoice = 'en-US_EmilyV3Voice'; break;
  case 'kate': fullVoice = 'en-GB_KateV3Voice'; break;
  case 'charlotte': fullVoice = 'en-GB_CharlotteV3Voice'; break;
  case 'james': fullVoice = 'en-GB_JamesV3Voice'; break;
  case 'craig': fullVoice = 'en-AU_CraigVoice'; break;
  case 'madison': fullVoice = 'en-AU_MadisonVoice'; break;
  default: fullVoice = voice;
}

let count = 0;
for (let text of lines) {
  if (!text.trim()) continue;

  const params = {
    text: text,
    voice: fullVoice,
    accept: `audio/${fileType};rate=${rate}`
  };
  const textToSpeech = new TextToSpeechV1({
    authenticator: new IamAuthenticator({ apikey }),
    serviceUrl: apiURL
  });
  count++;

  // Synthesize speech, correct the wav header, then save to disk
  // (wav header requires a file length, but this is unknown until after the header is already generated and sent)
  // note that `repairWavHeaderStream` will read the whole stream into memory in order to process it.
  // the method returns a Promise that resolves with the repaired buffer
  let outFileName = isSplit ? `${fileOut}-${count}.${fileType}` : `${fileOut}.${fileType}`;
  textToSpeech.synthesize(params)
    .then(response => {
      const audio = response.result;
      return textToSpeech.repairWavHeaderStream(audio);
    })
    .then(repairedFile => {
      fs.writeFileSync(outFileName, repairedFile);
      console.log('Wrote: '+outFileName);
    })
    .catch(err => {
      console.log(outFileName+": "+err);
    });
}
  