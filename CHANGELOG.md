# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.7](https://github.com/ecomplus/passport/compare/v0.2.6...v0.2.7) (2022-03-03)


### Bug Fixes

* **find-customer-by-email:** selecting customer who ordered when more than one is found ([786d7a6](https://github.com/ecomplus/passport/commit/786d7a6cd82d758fad000ffc7c4c6d326a96317b))

### [0.2.6](https://github.com/ecomplus/passport/compare/v0.2.5...v0.2.6) (2021-09-17)


### Bug Fixes

* **api:** set customer with empty `display_name` if undefined ([3b398a3](https://github.com/ecomplus/passport/commit/3b398a3633504d85dee9db162e19c7fbc6ee42a8))
* **identify:** properly returning customer id on signup by code ([6859158](https://github.com/ecomplus/passport/commit/68591587927e18d9396d33e4a416d5404da0fb07))

### [0.2.5](https://github.com/ecomplus/passport/compare/v0.2.4...v0.2.5) (2021-09-17)


### Bug Fixes

* **identify:** fix passing created customer object ([c84030d](https://github.com/ecomplus/passport/commit/c84030de9567fe97703a768d371f669e1628853b))

### [0.2.4](https://github.com/ecomplus/passport/compare/v0.2.3...v0.2.4) (2021-09-16)


### Bug Fixes

* **email-code:** endpoint json extension (optional by proxy) ([936e003](https://github.com/ecomplus/passport/commit/936e003f4b49e4820201632a109c93377efbc3b5))

### [0.2.3](https://github.com/ecomplus/passport/compare/v0.2.2...v0.2.3) (2021-09-14)


### Bug Fixes

* **api:** list carts and orders sorted by update desc by default ([b8b1c5f](https://github.com/ecomplus/passport/commit/b8b1c5ffd7c370d2d6d542b23fab2edf1dec5bf9))

### [0.2.2](https://github.com/ecomplus/passport/compare/v0.2.1...v0.2.2) (2021-09-13)


### Bug Fixes

* **email-code:** store param must be first on route, lang is optinal ([c967e7d](https://github.com/ecomplus/passport/commit/c967e7d7aebf60f7f2df42272e206c94afc0d71f))

### [0.2.1](https://github.com/ecomplus/passport/compare/v0.2.0...v0.2.1) (2021-09-13)

## [0.2.0](https://github.com/ecomplus/passport/compare/v0.1.25...v0.2.0) (2021-09-08)


### Bug Fixes

* **email-code:** fix setting logo image src on email html ([65239b9](https://github.com/ecomplus/passport/commit/65239b9b997947227b1fd3ea61e774be3fb92228))

### [0.1.25](https://github.com/ecomplus/passport/compare/v0.1.24...v0.1.25) (2021-09-08)


### Features

* **web:** add/handle endpoints for login with email code verification ([61c0e62](https://github.com/ecomplus/passport/commit/61c0e622801ceb86124d6417bf9ab4e31e969e0e))


### Bug Fixes

* **email-code-token:** properly get email and code from request body ([db8002d](https://github.com/ecomplus/passport/commit/db8002da2967620edf70ede14a37afd6bee32e56))
* **email-code:** fix getting email and lang fields from request body/params ([f4a9b3d](https://github.com/ecomplus/passport/commit/f4a9b3d9ddfc928676e0fb01f776ac8fbe72d914))
* **email-code:** fix mailjet send api body (`ReplyTo` object) ([62f5a30](https://github.com/ecomplus/passport/commit/62f5a30b230330897c3d6ac701fbda5c1d504852))
* **web:** check `profile` type string before json parse ([fff5aaf](https://github.com/ecomplus/passport/commit/fff5aaf6afc7d872e88fbc13cc028899a9de4c61))

### [0.1.24](https://github.com/ecomplus/passport/compare/v0.1.23...v0.1.24) (2021-05-18)


### Bug Fixes

* **api-routes:** fix handling auth validation errors ([b05fa0b](https://github.com/ecomplus/passport/commit/b05fa0b326e3191fd9b0d6dd55755de0b742a7e6))

### [0.1.23](https://github.com/ecomplus/passport/compare/v0.1.22...v0.1.23) (2021-05-18)


### Bug Fixes

* **auth:** prevent breaking current access tokens (level prop) ([24e3345](https://github.com/ecomplus/passport/commit/24e3345b028e89cd8342142ee426f479fa348370))

### [0.1.22](https://github.com/ecomplus/passport/compare/v0.1.21...v0.1.22) (2021-05-18)


### Bug Fixes

* **api:** delete (do not permit) loyalty points properties ([2c4eabc](https://github.com/ecomplus/passport/commit/2c4eabce2254cc6129342eb7f0120f1240b221f3))
* **auth:** check for disabled customer login/checkout ([#12](https://github.com/ecomplus/passport/issues/12)) ([21d5bb4](https://github.com/ecomplus/passport/commit/21d5bb40a9dbdb8296519dfbe1e760d1b372a86f))

### [0.1.21](https://github.com/ecomplus/passport/compare/v0.1.20...v0.1.21) (2021-05-10)


### Bug Fixes

* **deps:** update all, remove unecessary moment ([30df04e](https://github.com/ecomplus/passport/commit/30df04e32354bb6670e3268c6929f650b7be2b06))
* **facebook-scope:** remove 'birthday' field (blocked by fb due to lgpd updates) ([4eac116](https://github.com/ecomplus/passport/commit/4eac116456bb06eec029de86cdbca3dac5dac635))

### [0.1.20](https://github.com/ecomplus/passport/compare/v0.1.19...v0.1.20) (2020-05-16)


### Bug Fixes

* **web:** fix cookie options (secure) ([265b71d](https://github.com/ecomplus/passport/commit/265b71d1a8b6ec7393b80c54fbbb2b4d9d99a665))

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
