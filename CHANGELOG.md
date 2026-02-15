# Changelog

## [1.3.9](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.8...tiny-packages-v1.3.9) (2026-02-15)


### Bug Fixes

* strip _authToken from NPM_CONFIG_USERCONFIG for OIDC fallback ([4921358](https://github.com/LeviSchuck/tiny-packages/commit/4921358f02d189e4da5bfe54101d101b3a62de95))

## [1.3.8](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.7...tiny-packages-v1.3.8) (2026-02-15)


### Bug Fixes

* use NODE_AUTH_TOKEN="" inline for npm OIDC trusted publishing ([37abb49](https://github.com/LeviSchuck/tiny-packages/commit/37abb49925abc63fac6b1822b0fa56ae684be9ab))

## [1.3.7](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.6...tiny-packages-v1.3.7) (2026-02-15)


### Bug Fixes

* use registry-url then strip _authToken line for OIDC fallback ([7db59f8](https://github.com/LeviSchuck/tiny-packages/commit/7db59f8cb6da970c9be58bb1979a11d52271b1df))

## [1.3.6](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.5...tiny-packages-v1.3.6) (2026-02-15)


### Bug Fixes

* clear NODE_AUTH_TOKEN to prevent OIDC bypass ([a1bfbd2](https://github.com/LeviSchuck/tiny-packages/commit/a1bfbd212eb3e351c96149a09447645b82560020))

## [1.3.5](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.4...tiny-packages-v1.3.5) (2026-02-15)


### Bug Fixes

* write .npmrc with registry only, no token placeholder ([a045193](https://github.com/LeviSchuck/tiny-packages/commit/a045193ed0b6bcf4611fb1310561077d6ba636f5))

## [1.3.4](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.3...tiny-packages-v1.3.4) (2026-02-15)


### Bug Fixes

* restore registry-url for OIDC discovery and ensure npm &gt;= 11.5.1 ([857c306](https://github.com/LeviSchuck/tiny-packages/commit/857c3068c6d2d67e58990f502fb5d2fe387a94ae))

## [1.3.3](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.2...tiny-packages-v1.3.3) (2026-02-15)


### Bug Fixes

* remove registry-url from setup-node to allow OIDC auth fallback ([ef4b448](https://github.com/LeviSchuck/tiny-packages/commit/ef4b448a25dfbd62005af023bcb1e590578a1cb7))

## [1.3.2](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.1...tiny-packages-v1.3.2) (2026-02-15)


### Bug Fixes

* copy .npmrc into npm_build for OIDC auth discovery ([10be107](https://github.com/LeviSchuck/tiny-packages/commit/10be107d98c74445fc06a9019465e58500b2d34a))

## [1.3.1](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.3.0...tiny-packages-v1.3.1) (2026-02-15)


### Bug Fixes

* use npm OIDC trusted publishing instead of static token ([1b426b5](https://github.com/LeviSchuck/tiny-packages/commit/1b426b59edf890fa425a2da761723af3a3f9648c))

## [1.3.0](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.2.2...tiny-packages-v1.3.0) (2026-02-15)


### Features

* Add tiny-font-ranges package ([#25](https://github.com/LeviSchuck/tiny-packages/issues/25)) ([e95056b](https://github.com/LeviSchuck/tiny-packages/commit/e95056b68ab3f05ecba77ed3b09d00f61d5f21eb))

## [1.2.2](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.2.1...tiny-packages-v1.2.2) (2026-01-15)


### Bug Fixes

* Dynamically generate reed solomon codes ([f1b69a0](https://github.com/LeviSchuck/tiny-packages/commit/f1b69a001cd1f8685af1dc51ebc87f09e5759f93))

## [1.2.1](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.2.0...tiny-packages-v1.2.1) (2026-01-12)


### Bug Fixes

* Add convenience htmlNodeToHtmlElement function ([ae46552](https://github.com/LeviSchuck/tiny-packages/commit/ae46552b54fdde5b0c5676fc203f4314fdd662de))

## [1.2.0](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.1.0...tiny-packages-v1.2.0) (2026-01-12)


### Features

* Read PNG Headers ([3a1d81e](https://github.com/LeviSchuck/tiny-packages/commit/3a1d81ef1b7376105fc4fa5c6c46cc923b8ee152))
* Safe HTML sanitization ([59b6cc8](https://github.com/LeviSchuck/tiny-packages/commit/59b6cc809eb9324aaaceea00ebb8473b88fbc98f))

## [1.1.0](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.14...tiny-packages-v1.1.0) (2026-01-10)


### Features

* Indexed with automatic bit-depth ([5afafa5](https://github.com/LeviSchuck/tiny-packages/commit/5afafa54dc46419d86368e816207d5c70496fb08))


### Bug Fixes

* Types ([5076b44](https://github.com/LeviSchuck/tiny-packages/commit/5076b443aa93642dae1ae726546652ae646973ae))

## [1.0.14](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.13...tiny-packages-v1.0.14) (2026-01-10)


### Bug Fixes

* Add getTextContent ([3743e73](https://github.com/LeviSchuck/tiny-packages/commit/3743e73221847cdc8fb0cd47e96c3a9e15c04d4e))

## [1.0.13](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.12...tiny-packages-v1.0.13) (2026-01-10)


### Bug Fixes

* Export encode and decode html entities ([90c8f06](https://github.com/LeviSchuck/tiny-packages/commit/90c8f06a53c472cf559e3679466942e5706a87b7))

## [1.0.12](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.11...tiny-packages-v1.0.12) (2026-01-10)


### Bug Fixes

* add documentation symbols ([d7ca32f](https://github.com/LeviSchuck/tiny-packages/commit/d7ca32f9062803334211e10b7aaa0b442face210))
* Add QR Code disclosure ([137ee1e](https://github.com/LeviSchuck/tiny-packages/commit/137ee1e690dd70127670d06f52b5f7b22a0264ec))
* Add tiny-html ([632515c](https://github.com/LeviSchuck/tiny-packages/commit/632515c19a4918c8f32d79a21020cfc358eff14b))
* Build tiny-png type-check ([82e19e0](https://github.com/LeviSchuck/tiny-packages/commit/82e19e0eba6a28f23dde7670d680a3a14ebee3eb))
* Bump version ([71d49ed](https://github.com/LeviSchuck/tiny-packages/commit/71d49eddd4037f998969403ae5f5e2e40140d7b8))
* Correct the bun to npm publish transition ([5058776](https://github.com/LeviSchuck/tiny-packages/commit/505877668bf0d6f5e87469442f595e0ee9fc4037))
* Don't explode with builds ([e6a199d](https://github.com/LeviSchuck/tiny-packages/commit/e6a199d3c3fb84f8702aadcd74fca6c4c5349d5e))
* Exclude tsconfig ([7efc7ee](https://github.com/LeviSchuck/tiny-packages/commit/7efc7eed69749050d00f54ea2a70c5418379f3ac))
* fix tests ([0684cc9](https://github.com/LeviSchuck/tiny-packages/commit/0684cc929725784ccf0c273e1c5b5ecc75e7cb0a))
* Generalize type checking, add lints ([53fedf5](https://github.com/LeviSchuck/tiny-packages/commit/53fedf50034f23112b1b4703f031ed92f2b9449e))
* Ignore JSR for now ([5855cd1](https://github.com/LeviSchuck/tiny-packages/commit/5855cd1e8816afd301aef6f5e2fedd4d74c074a6))
* Introduce HTML Library ([#13](https://github.com/LeviSchuck/tiny-packages/issues/13)) ([5a9166d](https://github.com/LeviSchuck/tiny-packages/commit/5a9166dc23c5eede3680fab6b9c7d88bfb155fc9))
* Limit publication to tiny-packages ([1abde1c](https://github.com/LeviSchuck/tiny-packages/commit/1abde1c90d2ec892313f7395ea3448845a1bb4ef))
* Oops, use NPM not node ([020b28e](https://github.com/LeviSchuck/tiny-packages/commit/020b28e01a7b0406d73c2cb7ec1e901b12fa943f))
* Publishing should come through JSR now ([facca89](https://github.com/LeviSchuck/tiny-packages/commit/facca894b6dc4fa080c7ba0717bda757fe06be09))
* Remove unused env vars ([ea1af62](https://github.com/LeviSchuck/tiny-packages/commit/ea1af62fc74907ea2dc3a5f09f1ffdba9beda36d))
* Try NPM_CONFIG_TOKEN for bun (why do you need to be special?) ([9480bd8](https://github.com/LeviSchuck/tiny-packages/commit/9480bd8e645d05d060ca3397d6a7551d892699d5))
* Types ([5e6cfcc](https://github.com/LeviSchuck/tiny-packages/commit/5e6cfcc2829044c8bad886e1639a2642478ddcc9))
* Use NPM instead of bun for publishing ([03008ad](https://github.com/LeviSchuck/tiny-packages/commit/03008ad5aee5074a9a6522598fe1bdb69ee7571d))
* Use the same url as provenance ([414ed7c](https://github.com/LeviSchuck/tiny-packages/commit/414ed7ca496c30c63a2f6ebf83e8340d2b917614))

## [0.0.1](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v0.0.1...tiny-packages-v0.0.1) (2026-01-10)


### Bug Fixes

* add documentation symbols ([d7ca32f](https://github.com/LeviSchuck/tiny-packages/commit/d7ca32f9062803334211e10b7aaa0b442face210))
* Add QR Code disclosure ([137ee1e](https://github.com/LeviSchuck/tiny-packages/commit/137ee1e690dd70127670d06f52b5f7b22a0264ec))
* Add tiny-html ([09d5b20](https://github.com/LeviSchuck/tiny-packages/commit/09d5b202ada7f8cd2920c0af5b7b5321f8ece693))
* Build tiny-png type-check ([82e19e0](https://github.com/LeviSchuck/tiny-packages/commit/82e19e0eba6a28f23dde7670d680a3a14ebee3eb))
* Bump version ([71d49ed](https://github.com/LeviSchuck/tiny-packages/commit/71d49eddd4037f998969403ae5f5e2e40140d7b8))
* Correct the bun to npm publish transition ([5058776](https://github.com/LeviSchuck/tiny-packages/commit/505877668bf0d6f5e87469442f595e0ee9fc4037))
* Don't explode with builds ([e6a199d](https://github.com/LeviSchuck/tiny-packages/commit/e6a199d3c3fb84f8702aadcd74fca6c4c5349d5e))
* Exclude tsconfig ([7efc7ee](https://github.com/LeviSchuck/tiny-packages/commit/7efc7eed69749050d00f54ea2a70c5418379f3ac))
* fix tests ([0684cc9](https://github.com/LeviSchuck/tiny-packages/commit/0684cc929725784ccf0c273e1c5b5ecc75e7cb0a))
* Generalize type checking, add lints ([53fedf5](https://github.com/LeviSchuck/tiny-packages/commit/53fedf50034f23112b1b4703f031ed92f2b9449e))
* Ignore JSR for now ([5855cd1](https://github.com/LeviSchuck/tiny-packages/commit/5855cd1e8816afd301aef6f5e2fedd4d74c074a6))
* Introduce HTML Library ([#13](https://github.com/LeviSchuck/tiny-packages/issues/13)) ([5a9166d](https://github.com/LeviSchuck/tiny-packages/commit/5a9166dc23c5eede3680fab6b9c7d88bfb155fc9))
* Limit publication to tiny-packages ([1abde1c](https://github.com/LeviSchuck/tiny-packages/commit/1abde1c90d2ec892313f7395ea3448845a1bb4ef))
* Oops, use NPM not node ([020b28e](https://github.com/LeviSchuck/tiny-packages/commit/020b28e01a7b0406d73c2cb7ec1e901b12fa943f))
* Publishing should come through JSR now ([facca89](https://github.com/LeviSchuck/tiny-packages/commit/facca894b6dc4fa080c7ba0717bda757fe06be09))
* Remove unused env vars ([ea1af62](https://github.com/LeviSchuck/tiny-packages/commit/ea1af62fc74907ea2dc3a5f09f1ffdba9beda36d))
* Try NPM_CONFIG_TOKEN for bun (why do you need to be special?) ([9480bd8](https://github.com/LeviSchuck/tiny-packages/commit/9480bd8e645d05d060ca3397d6a7551d892699d5))
* Types ([5e6cfcc](https://github.com/LeviSchuck/tiny-packages/commit/5e6cfcc2829044c8bad886e1639a2642478ddcc9))
* Use NPM instead of bun for publishing ([03008ad](https://github.com/LeviSchuck/tiny-packages/commit/03008ad5aee5074a9a6522598fe1bdb69ee7571d))
* Use the same url as provenance ([414ed7c](https://github.com/LeviSchuck/tiny-packages/commit/414ed7ca496c30c63a2f6ebf83e8340d2b917614))


### Miscellaneous Chores

* release 0.0.1 ([d7166bb](https://github.com/LeviSchuck/tiny-packages/commit/d7166bb7dee6b96020a366b5ae7938cc7c62fed2))

## [0.0.1](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.10...tiny-packages-v0.0.1) (2026-01-10)


### Bug Fixes

* add documentation symbols ([d7ca32f](https://github.com/LeviSchuck/tiny-packages/commit/d7ca32f9062803334211e10b7aaa0b442face210))
* Add QR Code disclosure ([137ee1e](https://github.com/LeviSchuck/tiny-packages/commit/137ee1e690dd70127670d06f52b5f7b22a0264ec))
* Build tiny-png type-check ([82e19e0](https://github.com/LeviSchuck/tiny-packages/commit/82e19e0eba6a28f23dde7670d680a3a14ebee3eb))
* Bump version ([71d49ed](https://github.com/LeviSchuck/tiny-packages/commit/71d49eddd4037f998969403ae5f5e2e40140d7b8))
* Correct the bun to npm publish transition ([5058776](https://github.com/LeviSchuck/tiny-packages/commit/505877668bf0d6f5e87469442f595e0ee9fc4037))
* Don't double publish ([22759f9](https://github.com/LeviSchuck/tiny-packages/commit/22759f96770d7c9369c9ec5a85697018a7e5c0af))
* Don't explode with builds ([e6a199d](https://github.com/LeviSchuck/tiny-packages/commit/e6a199d3c3fb84f8702aadcd74fca6c4c5349d5e))
* Exclude tsconfig ([7efc7ee](https://github.com/LeviSchuck/tiny-packages/commit/7efc7eed69749050d00f54ea2a70c5418379f3ac))
* fix tests ([0684cc9](https://github.com/LeviSchuck/tiny-packages/commit/0684cc929725784ccf0c273e1c5b5ecc75e7cb0a))
* Generalize type checking, add lints ([53fedf5](https://github.com/LeviSchuck/tiny-packages/commit/53fedf50034f23112b1b4703f031ed92f2b9449e))
* Ignore JSR for now ([5855cd1](https://github.com/LeviSchuck/tiny-packages/commit/5855cd1e8816afd301aef6f5e2fedd4d74c074a6))
* Introduce HTML Library ([#13](https://github.com/LeviSchuck/tiny-packages/issues/13)) ([5a9166d](https://github.com/LeviSchuck/tiny-packages/commit/5a9166dc23c5eede3680fab6b9c7d88bfb155fc9))
* Limit publication to tiny-packages ([1abde1c](https://github.com/LeviSchuck/tiny-packages/commit/1abde1c90d2ec892313f7395ea3448845a1bb4ef))
* Oops, use NPM not node ([020b28e](https://github.com/LeviSchuck/tiny-packages/commit/020b28e01a7b0406d73c2cb7ec1e901b12fa943f))
* Publishing should come through JSR now ([facca89](https://github.com/LeviSchuck/tiny-packages/commit/facca894b6dc4fa080c7ba0717bda757fe06be09))
* Remove unused env vars ([ea1af62](https://github.com/LeviSchuck/tiny-packages/commit/ea1af62fc74907ea2dc3a5f09f1ffdba9beda36d))
* Try NPM_CONFIG_TOKEN for bun (why do you need to be special?) ([9480bd8](https://github.com/LeviSchuck/tiny-packages/commit/9480bd8e645d05d060ca3397d6a7551d892699d5))
* Types ([5e6cfcc](https://github.com/LeviSchuck/tiny-packages/commit/5e6cfcc2829044c8bad886e1639a2642478ddcc9))
* Use NPM instead of bun for publishing ([03008ad](https://github.com/LeviSchuck/tiny-packages/commit/03008ad5aee5074a9a6522598fe1bdb69ee7571d))
* Use the same url as provenance ([414ed7c](https://github.com/LeviSchuck/tiny-packages/commit/414ed7ca496c30c63a2f6ebf83e8340d2b917614))


### Miscellaneous Chores

* release 0.0.1 ([d7166bb](https://github.com/LeviSchuck/tiny-packages/commit/d7166bb7dee6b96020a366b5ae7938cc7c62fed2))

## [1.0.10](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.9...tiny-packages-v1.0.10) (2026-01-10)


### Bug Fixes

* Generalize type checking, add lints ([53fedf5](https://github.com/LeviSchuck/tiny-packages/commit/53fedf50034f23112b1b4703f031ed92f2b9449e))
* Introduce HTML Library ([#13](https://github.com/LeviSchuck/tiny-packages/issues/13)) ([5a9166d](https://github.com/LeviSchuck/tiny-packages/commit/5a9166dc23c5eede3680fab6b9c7d88bfb155fc9))


### Miscellaneous Chores

* release 1.0.10 ([d7166bb](https://github.com/LeviSchuck/tiny-packages/commit/d7166bb7dee6b96020a366b5ae7938cc7c62fed2))

## [1.0.9](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.8...tiny-packages-v1.0.9) (2026-01-09)


### Bug Fixes

* Correct the bun to npm publish transition ([5058776](https://github.com/LeviSchuck/tiny-packages/commit/505877668bf0d6f5e87469442f595e0ee9fc4037))

## [1.0.8](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.7...tiny-packages-v1.0.8) (2026-01-08)


### Bug Fixes

* Use the same url as provenance ([414ed7c](https://github.com/LeviSchuck/tiny-packages/commit/414ed7ca496c30c63a2f6ebf83e8340d2b917614))

## [1.0.7](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.6...tiny-packages-v1.0.7) (2026-01-08)


### Bug Fixes

* Oops, use NPM not node ([020b28e](https://github.com/LeviSchuck/tiny-packages/commit/020b28e01a7b0406d73c2cb7ec1e901b12fa943f))

## [1.0.6](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.5...tiny-packages-v1.0.6) (2026-01-08)


### Bug Fixes

* Use NPM instead of bun for publishing ([03008ad](https://github.com/LeviSchuck/tiny-packages/commit/03008ad5aee5074a9a6522598fe1bdb69ee7571d))

## [1.0.5](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.4...tiny-packages-v1.0.5) (2026-01-08)


### Bug Fixes

* Remove unused env vars ([ea1af62](https://github.com/LeviSchuck/tiny-packages/commit/ea1af62fc74907ea2dc3a5f09f1ffdba9beda36d))

## [1.0.4](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.3...tiny-packages-v1.0.4) (2026-01-08)


### Bug Fixes

* Try NPM_CONFIG_TOKEN for bun (why do you need to be special?) ([9480bd8](https://github.com/LeviSchuck/tiny-packages/commit/9480bd8e645d05d060ca3397d6a7551d892699d5))

## [1.0.3](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.2...tiny-packages-v1.0.3) (2026-01-08)


### Bug Fixes

* Limit publication to tiny-packages ([1abde1c](https://github.com/LeviSchuck/tiny-packages/commit/1abde1c90d2ec892313f7395ea3448845a1bb4ef))

## [1.0.2](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.1...tiny-packages-v1.0.2) (2026-01-08)


### Bug Fixes

* add documentation symbols ([d7ca32f](https://github.com/LeviSchuck/tiny-packages/commit/d7ca32f9062803334211e10b7aaa0b442face210))
* Add QR Code disclosure ([137ee1e](https://github.com/LeviSchuck/tiny-packages/commit/137ee1e690dd70127670d06f52b5f7b22a0264ec))
* Exclude tsconfig ([7efc7ee](https://github.com/LeviSchuck/tiny-packages/commit/7efc7eed69749050d00f54ea2a70c5418379f3ac))
* fix tests ([0684cc9](https://github.com/LeviSchuck/tiny-packages/commit/0684cc929725784ccf0c273e1c5b5ecc75e7cb0a))
* Publishing should come through JSR now ([facca89](https://github.com/LeviSchuck/tiny-packages/commit/facca894b6dc4fa080c7ba0717bda757fe06be09))

## [1.0.1](https://github.com/LeviSchuck/tiny-packages/compare/tiny-packages-v1.0.0...tiny-packages-v1.0.1) (2026-01-08)


### Bug Fixes

* Don't explode with builds ([e6a199d](https://github.com/LeviSchuck/tiny-packages/commit/e6a199d3c3fb84f8702aadcd74fca6c4c5349d5e))
* Ignore JSR for now ([5855cd1](https://github.com/LeviSchuck/tiny-packages/commit/5855cd1e8816afd301aef6f5e2fedd4d74c074a6))

## 1.0.0 (2026-01-08)


### Bug Fixes

* Build tiny-png type-check ([82e19e0](https://github.com/LeviSchuck/tiny-packages/commit/82e19e0eba6a28f23dde7670d680a3a14ebee3eb))
* Bump version ([71d49ed](https://github.com/LeviSchuck/tiny-packages/commit/71d49eddd4037f998969403ae5f5e2e40140d7b8))
* Types ([5e6cfcc](https://github.com/LeviSchuck/tiny-packages/commit/5e6cfcc2829044c8bad886e1639a2642478ddcc9))
