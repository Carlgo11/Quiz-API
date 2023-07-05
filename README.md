# Quiz

**Quiz answer form**

This project allows quiz participants to easily answer the questions on their mobile devices.  
Just share the site URL and the answers can be tracked in real time with scoreboard information for the organizer.

## Installation

This project is built upon Cloudflare Workers. You will need a Cloudflare account and
the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) for local installation.

1. Create KV workspaces
   The project requires two [Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) workspaces. One
   for storing the users (_teams_) and one for storing the questions.
   ![kv creation](https://i.imgur.com/dzp0mPP.png)

2. Write to wrangler.toml
   ```TOML
    kv_namespaces = [
      { binding = "USERS", id = "{ WORKSPACE ID }" },
      { binding = "QUESTIONS", id = "{ WORKSPACE ID }" }
    ]
   [env.production]
   vars = { ORIGINS = "{ YOUR DOMAIN }" }
   ```

3. Deploy the project
    ```SH
    wrangler deploy
    ```

## License

The project is licensed under GPLv3. See the full license [here](LICENSE).
