const fs = require('node:fs');
const arg = require('arg');
const { Readable } = require('node:stream');

// read .env and .env.defaults
require('dotenv-defaults/config');

const eleven = require('./eleven.js');

const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
const { get } = require('node:http');

const version = require('./package.json').version;

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
    '--provider': String,
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
    '-p': '--provider',
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
let fileOut = args['--out'] ?? 'audio';
let provider = args['--provider'] ?? 'ibm';
let isEleven = provider.toLowerCase() === 'eleven' || provider.toLowerCase() === '11';
let fileType = args['--type'] ?? 'wav';
let rate = args['--rate'] ?? 44100;
let voice = args['--voice'] ?? isEleven ? 'LQj2X4OpUuX9YFC5sCDw' : 'michael';
let apikey = args['--key'] ?? IBMKEY;
let apiURL = args['--url'] ?? IBMURL;
let isSplit = args['--split'] || false;
let cmdline = args._.join(' ').trim();

if (args['--version']) {
  console.log("say2file version " + version);
  process.exit(1);
}
if (args['--help']) {
  console.log("say2file [options] [optional text to convert to audio]");
  console.log("Options: --file or -f with filename (input text file)")
  console.log("         --split or -s (split the input text file into multiple output files)")
  console.log("         --out or -o with rootname (produces rootname.type or rootname-n.type)")
  console.log("         --provider or -p with provider(ibm, watson, eleven or 11)")
  console.log("         --list or -l (to list available voices)")
  console.log("         --key or -k with the API key to use (if not in .env)")
  console.log("         --version or -v (show version))")
  console.log("         --help or -h or -? (this help))")

  console.log("\nAddition options when using the IBM Watson provider:");
  console.log("         --url or -u with the service URL to use (if not in .env)")
  console.log("         --voice or -w (who) (choices: michael olivia kevin lisa allison henry james kate charlotte craig madison)");
  console.log("         --type or -t with type (choices: wav, mp3, mpeg, flac, ogg)")
  console.log("         --rate or -r with rate (sample rate, default is 44100)")

  console.log("\nAddition options when using the ElevenLabs provider:");
  console.log("         --voice or -w (who) (choices: default or voice-ID)");
  console.log("         --type or -t with type (choices: mp3)")
  console.log("         --rate or -r with rate (sample rate, default is 44100)")

  process.exit(1);
}

try {
  let lines = [];
  if (cmdline) {
    lines = [cmdline];
  } else
    if (fileIn) {
      let text = fs.readFileSync(fileIn, { encoding: 'utf8', flag: 'r' });
      if (isSplit) {
        lines = text.split('\n');
      } else {
        lines = [text];
      }
    } else {
      process.exit(0); // no work
    }

  async function doWork() {
    let fullVoice = voice;
    if (isEleven) {
      if (!voice) {
        voice = 'michael';  // default IBM Watson voice
      }
      eleven.init();
      let user = await eleven.getUser();
      if (user?.subscription) {
        const s = user.subscription;
        console.log(`ElevenLabs user, tier:${s.tier} character count/limit:${s.character_count}/${s.character_limit} reset on ${new Date(s.next_character_count_reset_unix*1000)}`);
      } else {
        console.log("ElevenLabs user: unknown");
      }
      // const data = await eleven.listVoices();
      // if (data?.voices) {
      //   for (let voice of data.voices) {
      //     console.log(`  ${voice.voice_id}: "${voice.name}"`);
      //   }
      // } else {
      //   console.log("ElevenLabs voices: unknown");
      // }
    } else {
      if (!voice){
        voice = 'michael';  // default IBM Watson voice
      }
      switch (voice.toLowerCase()) {
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
        case 'dieter': fullVoice = 'de-DE_DieterV3Voice'; break;
        case 'erika': fullVoice = 'de-DE_ErikaV3Voice'; break;
        case 'birgit': fullVoice = 'de-DE_BirgitV3Voice'; break;
        default: fullVoice = voice;
      }
    }

    let count = 0;
    for (let line of lines) {
      let text = line.trim();
      if (!text) continue;
      if (text.startsWith('#')) continue;

      count++;
      // Synthesize speech, correct the wav header, then save to disk
      // (wav header requires a file length, but this is unknown until after the header is already generated and sent)
      // note that `repairWavHeaderStream` will read the whole stream into memory in order to process it.
      // the method returns a Promise that resolves with the repaired buffer
      let outFileName = isSplit ? `${fileOut}-${count}.${fileType}` : `${fileOut}.${fileType}`;

      if (isEleven) {
        let ttsOptions = {
          text: text,
          voice_id: voice,
        }
        eleven.synthesize(ttsOptions).then(rs => {
          Readable.fromWeb(rs)
          .pipe(fs.createWriteStream(outFileName))
          .on('finish', () => {
            console.log('Wrote: ' + outFileName);
          })
          .on('error', error => {
            console.error(`Error on ${outFileName}:`, error);
          });
        }).catch(err => {
            console.log(outFileName + ": " + err);
        });
      } else {
        let ttsOptions = {
          text: text,
          voice: fullVoice,
          accept: `audio/${fileType};rate=${rate}`
        };
        const ibm = new TextToSpeechV1({
          authenticator: new IamAuthenticator({ apikey }),
          serviceUrl: apiURL
        });
        ibm.synthesize(ttsOptions)
          .then(response => {
            const audio = response.result;
            return textToSpeech.repairWavHeaderStream(audio);
          })
          .then(repairedFile => {
            fs.writeFileSync(outFileName, repairedFile);
            console.log('Wrote: ' + outFileName);
          })
          .catch(err => {
            console.log(outFileName + ": " + err);
          });
      }
    }
  }

  doWork().then(() => { }).catch(err => { console.error(err); });

} catch (err) {
  console.error(err);
}
