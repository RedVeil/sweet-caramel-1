# Popcorn

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/8af04768693b48bb9c84120bfde78d92)](https://app.codacy.com/gh/popcorndao/workspace?utm_source=github.com&utm_medium=referral&utm_content=popcorndao/workspace&utm_campaign=Badge_Grade_Settings)

- [Popcorn](#popcorn)
  - [Technology Used](#technology-used)
  - [Directory structure](#directory-structure)
  - [Prerequisites](#prerequisites)
  - [Getting started with development](#getting-started-with-development)
  - [Getting started with Frontend](#getting-started-with-frontend)
  - [Getting started with Contracts](#getting-started-with-contracts)
  - [Default Service Locations](#default-service-locations)
  - [Useful Commands](#useful-commands)
  - [Contributing](#contributing)

## Technology Used

- [Next.js](https://nextjs.org/)
- [Lerna](https://lerna.js.org)
- [Yarn](https://yarnpkg.com)
- [Storybook](https://storybook.js.org/)
- [React styled components](https://styled-components.com)
- [Solidity](https://soliditylang.org)
- [Hardhat](https://hardhat.org)
- [React testing library](https://testing-library.com/docs/react-testing-library/intro/)

## Directory structure

```
packages
├── app            [@popcorn/app]          [next.js]
├── hardhat        [@popcorn/hardhat]      [solidity contracts & typechain]
├── utils          [@popcorn/utils]        [generic utils]
├── ui             [@popcorn/ui]           [ui components + storybook]
└── ... etc
```

## Prerequisites

1. Install packages:
   - `yarn install`

## Getting started with development

1. To start a local ethereum environment and deploy all required contracts with demo data navigate into `packages/hardhat` and run:

```
yarn hardhat node --network hardhat
```

2. Then in another terminal go into `packages/app` and start the app with

```
yarn run dev
```


## Getting started with Frontend

Go to `packages/app`
1. Install packages

   - `yarn install`

2. Run dev (watch files and start up frontend)

   - `yarn run dev`

3. Start storybook (optional):
   - `yarn run story`

## Getting started with Contracts

To run tests:
go to `packages/hardhat` and run
`yarn hardhat test`

Deploy from `packages/hardhat`:

1. compile: `yarn compile`
2. and run : `yarn hardhat node --network [network]`

## Default Service Locations

| Service          | Location                    |
| ---------------- | --------------------------- |
| Next.js Frontend | http://localhost:3000       |
| Storybook        | run: `yarn lerna run story` |

## Useful Commands

| Command                              | Description                                                          |
| ------------------------------------ | -------------------------------------------------------------------- |
| `yarn install`                       | equivalent to `npm install`                                          |
| `yarn add @org/packagename`          | equivalent to `npm install` - will add to dependencies               |
| `yarn add @org/packagename -D`       | equivalent to `npm install --save-dev` - will add to devDependencies |

## Contributing

Contributions are welcome! Please raise a pull request with your contributions.

Popcorn follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/1/4/code-of-conduct).
