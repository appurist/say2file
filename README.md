# say2file
Text-to-speech, speaks text into a sound file.

This utility uses IBM's Watson AI text-to-speech API to convert text to one or more audio files.

## API KEY REQUIRED

It does not provide the API key by default, however you can register for one by creating an account on on [https://cloud.ibm.com/](https://cloud.ibm.com/) searching for "text-to-speech" in the list of services. The free tier provides text-to-speech usage limits that are ample for most personal projects.

https://cloud.ibm.com/services/text-to-speech/


## Configuration

See the `.env-example` file. You will need two things from the IBM website, the `IBMKEY` (the API key) and the `IBMURL` (service link). Copy `.env-sample` to `.env` and place in the current folder in order to avoid needing to specify both on the command line.

## Syntax

```
say2file [options] [optional text to convert to audio]
Options: --file or -f with filename (input text file)
         --split or -s (split the input text file into multiple output files)
         --out or -o with rootname (produces rootname.type or rootname-n.type)
         --voice or -w with who (michael olivia kevin lisa allison henry james kate charlotte craig madison)
         --type or -t with type (wav, mp3, mpeg, flac, ogg)
         --rate or -r with rate (sample rate, default is 44100)
         --key or -k with IBM Watson api key to use
         --url or -k with IBM Watson service URL to use
         --version or -v (show version))
         --help or -h or -? (this help))
```

## Example Usage

There are two forms of use: simple text on the command line, or text read from a file. Text read from a file can be split into multiple separate audio output files if the `-s` option is specified:

> `say2file Hello there, this is some text.`

This produces an `audio.wav` output file, using the `en-US_MichaelV3Voice` (Michael) default voice that says the text provided.

> `say2file -t mp3 Hello there, this is some text.`

This produces an `audio.mp3` output file, using the `en-US_MichaelV3Voice` (Michael) default voice that says the text provided on the rest of the line.

> `say2file -f sample.txt -s`

This reads a `sample.txt` input file and for each line splits the file (`-s`) by lines and finds (in this case) three uncommented lines to produce multiple audio files named `audio-1.wav`, `audio-2.wav` and `audio-3.wav`.

> `say2file -t mp3 -r 22050 -w kate -o voice Hello there.`

This produces a single MP3 file using Kate's voice (en-GB) with a sample rate of 22050 in `voice.mp3` where the audio is saying 'Hello there.' from the command line rather than a file.

> `say2file -t=mp3 -r=22050 -w=kate -o=voice Hello there.`

This is the same command with alternate syntax.
