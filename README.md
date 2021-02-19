# say2file
Text-to-speech, speaks text into a sound file.

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

## Example

The following command reads a `sample.txt` file and `splits` it to produce a separate `audio-n.wav` file for each line in the file (to avoid size limits on the service). I believe the limit is 5K per line:

`say2file -f sample.txt -s`

This produces a single MP3 file using Kate's voice (en-GB) with a sample rate of 22050 in `voice.mp3` where the audio is saying 'Hello there.' from the command line rather than a file:

`say2file -t mp3 -r 22050 -w kate -o voice Hello there.`

This is the same command with alternate syntax:

`say2file -t=mp3 -r=22050 -w=kate -o=voice Hello there.`

