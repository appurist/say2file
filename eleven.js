const Semaphore = require('async-mutex').Semaphore;

const LABSURL = process.env.hasOwnProperty("LABSURL") ? process.env["LABSURL"] : "https://api.elevenlabs.io";
const LABSKEY = process.env.hasOwnProperty("LABSKEY") ? process.env["LABSKEY"] : null;

const PAULCA_VOICE = 'EcOnXAJ3e2odu7bmr9M9';
const YOUTUBE_VOICE = 'LQj2X4OpUuX9YFC5sCDw';
const DEFAULT_VOICE = YOUTUBE_VOICE;

const DEFAULT_URL = "https://api.elevenlabs.io";
let apiURL = LABSURL ?? DEFAULT_URL;
let apiKey = LABSKEY;

const semaphore = new Semaphore(1);

function init(url, key) {
  apiURL = url ?? apiURL;
  apiKey = key ?? apiKey;
  return { apiURL, apikey: apiKey};
}

const FORMATS = [
  'mp3_44100_64', 'mp3_44100_96', 'mp3_44100_128', 'mp3_44100_192',
  'pcm_16000', 'pcm_22050', 'pcm_24000', 'pcm_44100'
];

async function apiCall(method, relativeURL, _headers, body) {
  return await semaphore.runExclusive(async () => {
    try {
      const headers = Object.assign({},
        {
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        ..._headers);
      let options = {
        method: method || "GET",
        headers: headers,
      }
      if (body) {
        options.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      return await fetch(apiURL + relativeURL, options);
    } catch (err) {
      console.log("apiCall: " + err.message);
    }
  });
}

async function getUser() {
  try {
    const response = await apiCall("GET", "/v1/user", [], null);
    const data = await response.json();
    // console.log("user: " + JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.log("getUser: " + err.message);
  }
  return null;
}

async function listVoices() {
  try {
    const response = await apiCall("GET", "/v1/voices", [], null);
    const data = await response.json();
    // console.log("listVoices: " + JSON.stringify(data, null, 2));
    return data;
  } catch (err) {
    console.log("listVoices: " + err.message);
  }
  return null;
}

async function synthesize(ttsOptions) {
  try {
    const acceptType = ttsOptions.output_format.startsWith("mp3_") ? 'audio/mpeg' : 'audio/wav';
    const headers = [{"Accept": acceptType}];
    const output_format = ttsOptions.output_format;

    // let body = Object.assign({}, ttsOptions, { "voice_id": ttsOptions?.voice_id });
    let body = Object.assign({},
      ttsOptions,
      {
        model_id: "eleven_monolingual_v1",
        voice_settings : {
          "stability": 0.5,
          "similarity_boost": 0.75,
          "style": 0.3,
        }
      });
    delete body.output_format;
    const response = await apiCall("POST", `/v1/text-to-speech/${ttsOptions?.voice_id}?output_format=${output_format}`, headers, body);
    if (response.ok) {
      // console.log(response.status, response.statusText, response.type, response.bodyUsed)
      return response.body;
    } else {
      throw new Error(response.status + " " + response.statusText);
    }
  } catch (err) {
    // console.log("synthesize: " + err.message);
    throw err;
  }
  // return null;
}

module.exports = {
  LABSURL, LABSKEY, FORMATS,
  DEFAULT_VOICE, PAULCA_VOICE, YOUTUBE_VOICE,
  init, getUser, listVoices, synthesize };
