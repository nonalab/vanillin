----

<p align="center" class="toc">
   <strong><a href="#setup">Setup</a></strong>
   |
   <strong><a href="#writing-tests">Writing tests</a></strong>
   |
   <strong><a href="#debugging-code">Debugging code</a></strong>
   |
   <strong><a href="#internals">Internals</a></strong>
</p>

----


# Contributing

Contributions are always welcome, no matter how large or small. Before
contributing, please read the
[code of conduct](https://github.com/nonalab/vanillin/blob/master/documentation/CODE_OF_CONDUCT.md).

## Not sure where to start?

- If you aren't just making a documentation change, you'll probably want to learn a bit about a few topics.

- Check out [`/documentations`](https://github.com/nonalab/vanillin/tree/master/documentations) for information about vanillin's internals

- When you feel ready to jump into the vanillin source code, a good place to start is to look for issues tagged with [help wanted](https://github.com/nonalab/vanillin/labels/help%20wanted) and/or [good first issue](https://github.com/nonalab/vanillin/labels/good%20first%20issue).

## Developing

The following prerequiste must be met:
- yarn@latest
- node@9
- lerna@latest
- truffle@latest
- ganache@latest
- chrome@latest
- metamsk@latest

```sh
$ git clone https://github.com/nonalab/vanillin
$ cd vanillin
$ lerna bootstrap
```

Run Ganache to have a local testnet. Grab the mnemonic and use it to create your test metamask wallet.

Open Chrome and create 2 profile (DO NOT USE YOUR MAIN PROFILE. WE WILL BE ABUSING METAMASK)

Open MetaMask:

Restore account:

Import some account from Ganache using its private key:

Deploy the contract:

```sh
$ lerna run deploy
```

Build the application:

```sh
$ lerna run build
```

> NOTE: Lerna can be run from anywhere within a vanillin project, be it root or child module!

Then:

```sh
cd packages/vanillin-web
yarn start
```

In the two Chrome instances, navigate to `https://localhost:3000`

### Writing tests

Most packages in [`/packages`](https://github.com/nonalab/vanillin/tree/master/packages) have a `test` folder.

### Debugging code

A common approach to debugging JavaScript code is to walk through the code using the [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/) debugger.
