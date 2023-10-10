const Semaphore = require('async-mutex').Semaphore;

const LABSURL = process.env.hasOwnProperty("LABSURL") ? process.env["LABSURL"] : "https://api.elevenlabs.io";
const LABSKEY = process.env.hasOwnProperty("LABSKEY") ? process.env["LABSKEY"] : null;

const PAULCA_VOICE = 'EcOnXAJ3e2odu7bmr9M9';
const YOUTUBE_VOICE = 'LQj2X4OpUuX9YFC5sCDw';
const MICHAEL_VOICE = 'flq6f7yk4E4fJM5XTYuZ';
const MATTHEW_VOICE = 'Yko7PKHZNXotIFUBG7I9';

const DEFAULT_VOICE = MICHAEL_VOICE;

const DEFAULT_MODEL = 'eleven_multilingual_v2';

const DEFAULT_URL = "https://api.elevenlabs.io";
let apiURL = LABSURL ?? DEFAULT_URL;
let apiKey = LABSKEY;

let cachedUser = null;

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
    cachedUser = data;
    return data;
  } catch (err) {
    console.log("getUser: " + err.message);
  }
  cachedUser = null;
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
    const user = await getUser();
    const tierLevel = user?.subscription?.tier ?? 'free';
    const isMP3 = ttsOptions.output_format.startsWith("mp3_");
    if (tierLevel === 'free') {
      if (ttsOptions.output_format === 'mp3_44100_192') {
        console.log("Free tier is limited to mp3_44100_128 format.");
        ttsOptions.output_format = 'mp3_44100_128';
      }
    }
    const acceptType = isMP3 ? 'audio/mpeg' : 'audio/wav';
    const headers = [{"Accept": acceptType}];
    const output_format = ttsOptions.output_format;
    let model_id = ttsOptions.model_id;
    switch (ttsOptions.model_id) {
      case 'e1': model_id = 'eleven_monolingual_v1'; break;
      case 'e2': model_id = 'eleven_monolingual_v2'; break;
      case 'm1': model_id = 'eleven_multilingual_v1'; break;
      case 'm2': model_id = 'eleven_multilingual_v2'; break;
      case '': model_id = DEFAULT_MODEL; break;
      case null: model_id = DEFAULT_MODEL; break;
      case undefined: model_id = DEFAULT_MODEL; break;
    }
    console.log("Using model: " + model_id);
    // let body = Object.assign({}, ttsOptions, { "voice_id": ttsOptions?.voice_id });
    let body = Object.assign({},
      ttsOptions,
      {
        model_id: model_id,
        voice_settings : {
          "stability": 0.75,
          "similarity_boost": 0.75,
          "style": 0.0,
        }
      });
    delete body.output_format;
    const response = await apiCall("POST", `/v1/text-to-speech/${ttsOptions?.voice_id}?output_format=${output_format}`, headers, body);
    if (response.ok) {
      // console.log(response.status, response.statusText, response.type, response.bodyUsed)
      return response.body;
    } else {
      if (response.type === 'basic') {
        const json = await response.text();
        const data = JSON.parse(json);
        const detail = data?.detail;
        const msg = detail?.message ?? data?.message ?? response.statusText ?? detail ?? json;
        // console.log(response.status, response.statusText, response.type, msg);
        throw new Error(response.status + " " + msg);
      }
      // return msg;
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
