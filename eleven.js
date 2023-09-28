const LABSURL = process.env.hasOwnProperty("LABSURL") ? process.env["LABSURL"] : null;
const LABSKEY = process.env.hasOwnProperty("LABSKEY") ? process.env["LABSKEY"] : null;

const DEFAULT_URL = "https://api.elevenlabs.io";
let apiURL = LABSURL ?? DEFAULT_URL;
let apiKey = LABSKEY;

function init(url, key) {
  apiURL = url ?? apiURL;
  apiKey = key ?? apiKey;
  return { apiURL, apikey: apiKey};
}

async function apiCall(method, relativeURL, _headers, body) {
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
  return null;
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
    const headers = [{"Accept": "audio/mpeg"}];

    // let body = Object.assign({}, ttsOptions, { "voice_id": ttsOptions?.voice_id });
    let body = Object.assign({},
      ttsOptions,
      {
        model_id: "eleven_monolingual_v1",
        voice_settings : {
          "stability": 0.5,
          "similarity_boost": 0.5,
        }
      });
    const response = await apiCall("POST", "/v1/text-to-speech/" + ttsOptions?.voice_id, headers, body);
    if (response.ok) {
      console.log(response.status, response.statusText, response.type, response.bodyUsed)
      return response.body;
    } else throw new Error(response.status + " " + response.statusText);
  } catch (err) {
    console.log("synthesize: " + err.message);
  }
  return null;
}

module.exports = { LABSURL, LABSKEY, init, getUser, listVoices, synthesize };