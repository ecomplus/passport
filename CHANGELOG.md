# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.1.19](https://github.com/ecomplus/passport/compare/v0.1.18...v0.1.19) (2020-04-03)


### Bug Fixes

* **oauth:** mounting session url to redirect, pass pathnames on query ([a864b94](https://github.com/ecomplus/passport/commit/a864b949afc9ace43d1f672f07e456ad081e1918))

### [0.1.18](https://github.com/ecomplus/passport/compare/v0.1.17...v0.1.18) (2020-04-03)


### Bug Fixes

* **auth-flow:** fix checking session and prevent infinite redirect ([595243c](https://github.com/ecomplus/passport/commit/595243cb2e456fed79254286ac1d75cc0558a5c0))

### [0.1.17](https://github.com/ecomplus/passport/compare/v0.1.16...v0.1.17) (2020-03-30)


### Bug Fixes

* **oauth:** iframe may not work on safari, fallback with redirects ([5fd529e](https://github.com/ecomplus/passport/commit/5fd529e894b09297dea54bb7c6146a5f348db3a2))

### [0.1.16](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.15...v0.1.16) (2020-01-19)


### Bug Fixes

* **api:** always pass auth level >= 2 ([00022d5](https://github.com/ecomclub/ecomplus-passport/commit/00022d5))

### [0.1.15](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.14...v0.1.15) (2020-01-14)


### Bug Fixes

* **api:** permit saving correct customer on cart/order post ([033852e](https://github.com/ecomclub/ecomplus-passport/commit/033852e))

### [0.1.14](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.13...v0.1.14) (2020-01-13)


### Bug Fixes

* **api-route:** fix mounting store api endpoint (again), reject delete ([c9f72bd](https://github.com/ecomclub/ecomplus-passport/commit/c9f72bd))

### [0.1.13](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.12...v0.1.13) (2020-01-12)


### Bug Fixes

* **api-route:** fix mounting store api endpoint ([354ef0d](https://github.com/ecomclub/ecomplus-passport/commit/354ef0d))
* **google-strategy:** migrate to google sign in (update scope) ([#1](https://github.com/ecomclub/ecomplus-passport/issues/1)) ([2381909](https://github.com/ecomclub/ecomplus-passport/commit/2381909))

### [0.1.12](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.11...v0.1.12) (2019-12-26)


### Bug Fixes

* **api:** do not permit to edit some order properties directly ([229c798](https://github.com/ecomclub/ecomplus-passport/commit/229c798))

### [0.1.11](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.10...v0.1.11) (2019-10-03)


### Bug Fixes

* **api-auth:** check req.req.originalUrl instead of req.path ([474bbf4](https://github.com/ecomclub/ecomplus-passport/commit/474bbf4))

### [0.1.10](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.9...v0.1.10) (2019-10-03)


### Bug Fixes

* **auth:** accept path to 'me.json' with level 2 ([4506c1d](https://github.com/ecomclub/ecomplus-passport/commit/4506c1d))

### [0.1.9](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.8...v0.1.9) (2019-09-26)


### Features

* **customer-fields:** add 'registry_type' to default customer fields ([8a66865](https://github.com/ecomclub/ecomplus-passport/commit/8a66865))

### [0.1.8](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.7...v0.1.8) (2019-09-25)


### Features

* **auth-level:** returning level number on auth object ([567929a](https://github.com/ecomclub/ecomplus-passport/commit/567929a))

### [0.1.7](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.6...v0.1.7) (2019-08-26)


### Bug Fixes

* **oauth-session:** setting content-type header ([858573a](https://github.com/ecomclub/ecomplus-passport/commit/858573a))

### [0.1.6](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.5...v0.1.6) (2019-08-26)


### Features

* **oauth-session:** add endpoint to set sig cookie ([cf4efe6](https://github.com/ecomclub/ecomplus-passport/commit/cf4efe6))

### [0.1.5](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.4...v0.1.5) (2019-08-25)


### Bug Fixes

* **list-providers:** returns only providers public info ([680bb78](https://github.com/ecomclub/ecomplus-passport/commit/680bb78))

### [0.1.4](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.3...v0.1.4) (2019-08-21)


### Bug Fixes

* **auth:** check for level property on decoded token object ([cd2e7bf](https://github.com/ecomclub/ecomplus-passport/commit/cd2e7bf))

### [0.1.3](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.2...v0.1.3) (2019-08-21)


### Bug Fixes

* **get-providers:** returning providers list correctly ([30c71bb](https://github.com/ecomclub/ecomplus-passport/commit/30c71bb))

### [0.1.2](https://github.com/ecomclub/ecomplus-passport/compare/v0.1.1...v0.1.2) (2019-08-21)


### Bug Fixes

* **oauth-providers:** responde with res.json ([14e6258](https://github.com/ecomclub/ecomplus-passport/commit/14e6258))

### 0.1.1 (2019-08-21)


### Bug Fixes

* **auth:** check authorization level by request method ([0814c42](https://github.com/ecomclub/ecomplus-passport/commit/0814c42))
* **customer-fields:** fix returned customer fields on find (public) ([946c995](https://github.com/ecomclub/ecomplus-passport/commit/946c995))
* **oauth-providers:** fix endpoint to list providers links ([192040f](https://github.com/ecomclub/ecomplus-passport/commit/192040f))
* [#8](https://github.com/ecomclub/ecomplus-passport/issues/8) ([dca9125](https://github.com/ecomclub/ecomplus-passport/commit/dca9125))
* css box size fix (remove horizontal scroll) ([fa059b9](https://github.com/ecomclub/ecomplus-passport/commit/fa059b9))
* set fields ([5785e9a](https://github.com/ecomclub/ecomplus-passport/commit/5785e9a))


### Features

* **identity:** add identify endpoint to find customer by email/doc ([ce38223](https://github.com/ecomclub/ecomplus-passport/commit/ce38223))
* authentication level associated with the access_token ([2cbc998](https://github.com/ecomclub/ecomplus-passport/commit/2cbc998))
* find customer by email and optionaly by doc_number ([c674f82](https://github.com/ecomclub/ecomplus-passport/commit/c674f82))
* login by e-mail and doc_number ([02c7b50](https://github.com/ecomclub/ecomplus-passport/commit/02c7b50))
* login via rest ([eb3ad5c](https://github.com/ecomclub/ecomplus-passport/commit/eb3ad5c))
* removed unnecessary properties ([1ef0f3c](https://github.com/ecomclub/ecomplus-passport/commit/1ef0f3c))
* removed unnecessary properties ([42072fe](https://github.com/ecomclub/ecomplus-passport/commit/42072fe))
