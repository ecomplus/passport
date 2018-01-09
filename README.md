# ecomplus-passport
E-Com Plus service for customer login and signup with Passportjs

# Technology stack
+ [NodeJS](https://nodejs.org/en/) 8.9.x
+ [Rest Auto Router](https://www.npmjs.com/package/rest-auto-router) package
+ [Passport](http://www.passportjs.org/) package
+ OAuth strategies: Facebook, Google, Twitter, Instagram, Yahoo and Windows Live

# Setting up
```bash
git clone https://github.com/ecomclub/ecomplus-passport
cd ecomplus-passport
cp config/config-sample.json config.json
nano config.json
```

Edit `config.json` placing correct values for your environment,
after that, start app with node:

```bash
node ./main.js
```

# Web server
You need to use a web server such as NGINX or Apache HTTP,
proxy passing the requests to configured TCP port.
Your proxy must pass _X-Authentication_ header with same value of
`config.http.proxy.auth`.
