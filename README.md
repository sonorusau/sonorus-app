# GH Util (Prototype)

An Electron application with React and TypeScript.

GUI tool for performing actions on GitHub repositories in bulk.

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```
#### Environment Variables
Add an `.env` file at project root.

The file should contain the following env variables:
```bash
# Your PAT for development usage with GitHub Enterprise Cloud (GHEC) REST API.
RENDERER_VITE_GITHUB_TOKEN=MY_TOKEN

# Your PAT for development usage with GitHub Enterprise Server (GHES) REST API.
RENDERER_VITE_GITHUB_ENTERPRISE_SERVER_TOKEN=MY_TOKEN
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```

### Error and Workarounds

#### `RequestError: Self-signed certificate in certificate chain`

* Workaround
```sh
export NODE_TLS_REJECT_UNAUTHORIZED=0
```
