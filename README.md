# ecomplus-passport
E-Com Plus service for customer login and signup with Passportjs

# Technology stack
+ [NodeJS](https://nodejs.org/en/) 8.9.x
+ [Express](http://expressjs.com/) web framework package
+ [Passport](http://www.passportjs.org/) package
+ OAuth strategies: Facebook, Google, Twitter, Instagram, Yahoo and Windows Live
+ [JSON Web Token](https://jwt.io/)

# Setting up
```bash
git clone https://github.com/ecomclub/ecomplus-passport
cd ecomplus-passport
cp config/config-sample.json config/config.json
nano config/config.json
```

Edit `config.json` placing correct values for your environment,
after that, start app with node:

```bash
node ./main.js
```

# Web server
You need to use a web server such as NGINX or Apache HTTP,
proxy passing the requests to configured TCP port.

# Frontend script

## Example

```javascript
var uri = 'https://passport.e-com.plus/v1/pt_br/1004/sdjcksadcasbcsabdcbsldjlbcasbdcs/login.html'
var popup = window.open(uri, 'Passport', 'height=400,width=340')
if (window.focus) {
  popup.focus()
}
popup.onunload = function () {
  // run ajax to get token
}
```
