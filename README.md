<a href="https://tm9657.de?ref=github"><p align="center"><img width=250 src="https://cdn.tm9657.de/tm9657/images/jwk-store.png" /></p></a>
<p align="center">
    <a href="https://tm9657.de"><img src="https://img.shields.io/badge/website-more_from_us-C0222C.svg?style=flat&logo=PWA"> </a>
	  <a href="https://discord.ca9.io"><img src="https://img.shields.io/discord/673169081704120334?label=discord&style=flat&color=5a66f6&logo=Discord"></a>
	  <a href="https://twitter.com/tm9657"><img src="https://img.shields.io/badge/twitter-follow_us-1d9bf0.svg?style=flat&logo=Twitter"></a>
	  <a href="https://www.linkedin.com/company/tm9657/"><img src="https://img.shields.io/badge/linkedin-connect-0a66c2.svg?style=flat&logo=Linkedin"></a>
    <a href="https://merch.ca9.io"><img src="https://img.shields.io/badge/merch-support_us-red.svg?style=flat&logo=Spreadshirt"></a>
</p>

# 🔐 JWK Store
The JWK Store is a flexible solution that allows you to provide your services with custom JSON Web Keys (JWK). It enables clients to request a JWK from the server, which can be associated with a password. If no JWK is found for the given ID, a new one will be generated.

The private JWK resulting from this process is encrypted using the provided password and stored in KV alongside a bcrypt hashed password. On the other hand, clients can retrieve the public JWK associated with a specific ID without needing to provide any password.

Clients with the password and API-Key can send a request to the server with an attached password in order to retrieve the private JWK. The server will verify if the provided password matches against the stored bcrypt hash and use it to successfully decrypt and return the private JWK.

Endpoints:
- **GET /**   - public
- **GET /:id** - public
Fetches the public JWK.
- **POST /secure/:id** - API Key required
If the ID is not used, creates a new JWK. If the JWK is already used returns the exisiting private JWK.
- **DELETE /secure/:id** - API Key required
Removes the JWK.

## Features
- Flexible JWK Management
- Easy JWK Distribution for Serverless or other horizontally scaled environments

## Setup
Configure a KV to use with the app. Insert the ID in the wrangler.toml.

> - `bun install` ➡️ installs the dependencies
> - `wrangler secret put API_KEY` ➡️ set an API-Key. Remember this key as it has to be used to create new JWK or fetch the private keys of them.
> - `bun run deploy` ➡️ deploys the solution to cloudflare
> - `(optional) set a custom domain in your dashboard`

**Provided by TM9657 GmbH with ❤️**
### Check out some of our products:
- [Kwirk.io](https://kwirk.io?ref=github) (Text Editor with AI integration, privacy focus and offline support)
