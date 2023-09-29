# say2file
Text-to-speech, speaks text into a sound file.

This utility supports too different AI-based text-to-speech providers:
- IBM's Watson AI text-to-speech API (https://cloud.ibm.com/services/text-to-speech/)
- ElevenLabs' text-to-speech API (https://docs.elevenlabs.io/)

When enabled with an API key from the provider, it can to convert text to one or more audio files.

## API KEY REQUIRED

This utility does not provide the API key by default, however you can register for one by:
- creating an account on [https://cloud.ibm.com/](https://cloud.ibm.com/) and [searching for "text-to-speech"](https://cloud.ibm.com/services/text-to-speech/) in the list of services. The free tier provides text-to-speech usage limits that are ample for most personal projects, or
- creating an account on [https://elevenlabs.io](https://elevenlabs.io) and getting your API key from your profile (see documentation here: https://docs.elevenlabs.io/api-reference/quick-start/authentication).



## Configuration

Copy `.env-sample` to `.env` and place in the current folder in order to avoid needing to specify configuration parameters on the command line. See the `.env-example` file:
- For **ElevenLabs**, you only need to add the API key from your profile to the `.env` file. Define a `LABSKEY=api-key-here` in the `.env` file and you're good to go. After logging in, you can find this by selecting the Profile menu item from the drop-down in the top-right on the https://elevenlabs.io/ site.
- For **IBM Watson**, you should define a pair of definitions in the `.env` file: the `IBMKEY` (the API key) and the `IBMURL` (service link) must be defined.

**Note:** It is also possible to define *both* providers, and switch back and forth on the command line with the `-p` option.

With this in place, you can simply run `say2file -l` to get a list of available voices, or `say2file "Hello there."` to generate a corresponding `audio.mp3` file. You can also run `say2file -f sample.txt` to read the `sample.txt` file and convert it to audio, or `say2file -f sample.txt -s` to split the file into multiple audio files.

## Syntax

```
say2file [options] [optional text to convert to audio]
Options: --file or -f with filename (input text file)
         --split or -s (split the input text file into multiple output files)
         --out or -o with rootname (produces rootname.type or rootname-n.type)
         --provider or -p with provider ("ibm", "watson", "eleven" or "11")
         --list or -l (to list available voices)
         --voice or -w with the name (IBM) or the voice ID (ElevenLabs)
         --key or -k with the API key to use (if not in .env)
         --url or -k with the service URL to use (if not in .env)

Additional options when using the IBM Watson provider:
         --type or -t with type (wav, mp3, mpeg, flac, ogg)
         --rate or -r with rate (sample rate, default is 44100)
         --version or -v (show version)
         --help or -h or -? (this help)

For IBM, the voice can can be: michael, olivia, kevin, lisa, allison, henry, james, kate, charlotte, craig, or madison.

For ElevenLabs, please use the --list or -l option to see the available voices and their IDs. You will need to specify the ID when using the --voice or -w option with ElevenLabs.
```

You can sample a list of community voices to add to your collection here: https://elevenlabs.io/voice-library and, once added, they will show up in your `--list` output. This will provide the ID. For example, if I add the distinguished older British "Edwin" to my library, it shows as custom ID `dcvIfKGCH8jXVgG77zhi`. Your custom ones will be at the end of the list. I can then use this ID to generate audio with the `--voice` option:
```
say2file -w dcvIfKGCH8jXVgG77zhi "Hello there."
```

## Example Usage

There are two forms of use: simple text on the command line, or text read from a file. Text read from a file can be split into multiple separate audio output files if the `-s` option is specified:

> `say2file Hello there, this is some text.`

This produces an `audio.mp3` output file, using the `en-US_MichaelV3Voice` (Michael) default voice that says the text provided.

Quotes around the remaining commandline options are not required, but are recommended if you have spaces in your text.

> `say2file -p ibm -t wav "Hello there, this is some text."`

This produces an `audio.wav` output file, using IBM Watson with the `en-US_MichaelV3Voice` (Michael) default voice that says the text provided on the rest of the line.

> `say2file -p 11 "Hello there, this is some text."`

This produces an `audio.mp3` output file, using the `say2file` default ElevenLabs voice. Since this is the default provider, the `-p` option is not actually required.

> `say2file -f sample.txt -s`

This reads a `sample.txt` input file and for each line splits the file (`-s`) by lines and finds (in this case) three uncommented lines to produce multiple audio files named `audio-1.wav`, `audio-2.wav` and `audio-3.wav`.

> `say2file -t mp3 -r 22050 -w kate -o voice Hello there.`

This produces a single MP3 file using Kate's voice (en-GB) with a sample rate of 22050 in `voice.mp3` where the audio is saying 'Hello there.' from the command line rather than a file.

> `say2file -t=mp3 -r=22050 -w=kate -o=voice Hello there.`

This is the same command with alternate syntax.
