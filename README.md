# tweet2meural

Use twitter to send pictures to your [Meural](https://www.meural.com) Canvas!

## Install
1. Clone this repository
2. In stall dependancies (`yarn install`)
3. `cp .env.example .env`, and fill out your API keys.  You will need to create a twitter app, which can be done at `apps.twitter.com`
4. run it! `yarn start`

Now any tweet with an image attachment which contains the hashtag you set in `TWITTER_TAG` will be sent to a new playlist for your Meural Canvas!

This application is a Dameon, not a web application.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/evantahler/tweet2meural)

## Notes
* When you shut down the process, all uploaded images to Meural will be deleted and the playlist deleted as well.
* If you own more than one Meural canvas in your account the "first" one will be used
* If the tweet contains more than one image attachment, only the first one will be used.
* Meural API docs can be found at https://documenter.getpostman.com/view/1657302/RVnWjKUL
