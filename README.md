[![MIT License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://github.com/RocketChat/Rocket.Chat/raw/master/LICENSE)

# Bot Giovanni

Shameless purloigned from the (MIT) Hubot adapter for Rocket.Chat with a sprinkling of (MPL) Mozilla Hubs JS code (three-utils.js).

This is proof-of-concept code (avert your eyes) that sends a bot into a Hubs room. This was originally intended to serve (virtual) canapés during a screening of Don Giovanni, shortly after the initial 2020 lockdown.

It functions by using puppeteer and headless Chrome to join a Hubs room, with the bot flag, and relays activity in the text chat to/from the underlying Hubot. By filtering text to send for certain keywords, the Hubot can also respond with movement or action instructions (e.g. sending `MOVE username` from a Hubot plugin should make Bot Giovanni move toward the user with name "username"). This should allow easy creation/extension of bot plugins to the VR environment using standard text-based chatbot commands, leaving the interaction handling to this wrapper.

**While the additions here are very rough, it is worth noting that the hubot underlying this is solid, and this should be easily iterable to a robust Hubot-in-Hubs implementation.**

## Usage

Bot Giovanni can be looped into a room with the following two steps:

    docker build --build-arg HUBS_URL=https://hubs.mozilla.com/EGqR4aZ/fixed-lighthearted-huddle -t bot-giovanni .
    docker run bot-giovanni

You should probably pre-join the room to make sure it's created, but Bot G will hang around as long as its running even if you leave. When you run the bot, you will see it join with a random avatar name (self-naming: another low-hanging fruit).

The HUBS_URL given is an example. No particular reason this is fixed in the environment - it could be dynamically settable, or even have Bot Giovanni instructable to jump into a given room. By default, Bot Giovanni responds to any hubot command in the text chat that begins "bot-giovanni".

A few simple commands:

    bot-giovanni help

Give a standard hubot help output in the text chat.

    bot-giovanni pug me

Example of a standard hubot command - outputs a URL link to the text chat.

    bot-giovanni here

An actual non-text Hubs command - the bot will shoot over towards the sender.

Now these are implemented, this should provide a basis for extending, and refining some of the hacky integration steps (see run-bot.js).

## Use Cases

While having an opera butler is its own reward, there are in fact other uses for Bot Giovanni. These are generally low-hanging fruit - more complex use-cases could be imagined, but these ones should be (fairly) quickly realisable.

  * Screen-sharing from the bot to enable:
     * Automatic display of links that require login or interactions (e.g. video platforms or streams)
     * Interactive automated sequences of web interactions
     * Automatic sizing of links once created for visibility
  * Automatically adding objects to rooms based on dynamic logic (commands, events, timers, chatops, etc.). Your bot could throw a ball at you when your build breaks... Or perhaps act as a dice-roller
  * Changing or moving objects in rooms, or its avatar, in response to commands/events. E.g. rearranging talk streams, or connecting to new stream URLs at specified times.
  * Adding/removing links to other rooms
  * Anything Hubot can do, e.g. ChatOps
  * Recording video/audio (with consent!)
  * Taking group photographs of people on demand
  * Running an interactive virtual tour
  * Highlighting newsflashes by, well, doing things
  * Switching the room (or room title/properties) based on commands/events
  * Want a familiar to follow you about? Have a Hubs cat.

You get the jist. Feature requests welcome in the Issues.
