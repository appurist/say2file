# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

say2file is a Node.js CLI tool that converts text to speech audio files using two TTS providers:
- **ElevenLabs** (default, recommended) - uses `eleven.js`
- **IBM Watson** - uses `ibm-watson-fetch.js` (custom fetch-based implementation replacing the official SDK)

## Commands

```bash
# Run with text from command line
pnpm dev                          # runs: node say2file.js Hello there, this is Paul.

# Run with input from file (split mode)
pnpm test                         # runs: node say2file.js -f sample.txt -s

# Build executables (uses pkg)
pnpm build                        # builds for current platform
pnpm build:win                    # Windows x64
pnpm build:linux                  # Linux x64
pnpm build:mac                    # macOS x64
```

## Configuration

Requires API keys in `.env` file (copy from `.env-example`):
- `LABSKEY` - ElevenLabs API key (required for ElevenLabs)
- `IBMKEY` and `IBMURL` - IBM Watson credentials (required for IBM)
- `LABSURL` - Optional ElevenLabs URL override

## Architecture

**Entry Point**: `say2file.js`
- Parses CLI arguments using `arg` library
- Routes to appropriate provider based on `-p` flag (eleven/11 or ibm/watson)
- Supports file input (`-f`) with optional split mode (`-s`) for line-by-line audio generation

**Provider Modules**:
- `eleven.js` - ElevenLabs API wrapper with semaphore-controlled API calls, handles voice listing, user quota info, and speech synthesis
- `ibm-watson-fetch.js` - Lightweight fetch-based IBM Watson TTS client with WAV header repair functionality (replaces heavy SDK dependency)

**Key Design Decisions**:
- Uses `async-mutex` Semaphore to serialize ElevenLabs API calls
- IBM Watson implementation includes manual WAV header repair for streaming audio
- Free tier ElevenLabs users are auto-downgraded to `mp3_44100_128` format
