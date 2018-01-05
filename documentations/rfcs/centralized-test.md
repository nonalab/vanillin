# Centralized Test

Most of the test, especially for the exchange modules, are condensed into the `vanillin-test` module. The reason being, in order to test that each and every exchange module has the same API, they should pass the same test suite, using the same API call.

As for the model and the store, their test are local since they are unique module.

At the moment, hitbtc and bitfinex passes most of the test. But for some reason, they cannot run together(!)

There are two ways to run test: auto test using `ava` and manual test using `babel-node`. Both of these method has been abstracted into npm scripts.

To run auto test:

```
lerna run build;
lerna run test;
```

To run manual test:

```
lerna run build;
cd vanillin/packages/vanillin-test
yarn manual;
```
