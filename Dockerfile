FROM node:latest

RUN npm install -g coffee-script yo generator-hubot  &&  \
	useradd hubot -m

USER hubot

WORKDIR /home/hubot

ENV BOT_NAME "bot-giovanni"
ENV BOT_OWNER "No owner specified"
ENV BOT_DESC "Hubot with rocketbot adapter"

ENV EXTERNAL_SCRIPTS=hubot-diagnostics,hubot-help,hubot-google-images,hubot-google-translate,hubot-pugme,hubot-maps,hubot-rules,hubot-shipit

RUN yo hubot --owner="$BOT_OWNER" --name="$BOT_NAME" --description="$BOT_DESC" --defaults && \
	sed -i /heroku/d ./external-scripts.json && \
	sed -i /redis-brain/d ./external-scripts.json && \
	npm install hubot-scripts

ADD . /home/hubot/hubot-rocketchat

# hack added to get around owner issue: https://github.com/docker/docker/issues/6119
USER root
RUN apt-get update && apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
RUN chown hubot:hubot -R /home/hubot/hubot-rocketchat
USER hubot

RUN cd /home/hubot/hubot-rocketchat && \
	npm install && \
	#coffee -c /home/hubot/node_modules/hubot-rocketchat/src/*.coffee && \
	cd /home/hubot
RUN ln -s /home/hubot/hubot-rocketchat /home/hubot/node_modules/hubot-rocketchat
RUN npm install --save puppeteer query-string

ARG HUBS_URL
ENV HUBS_URL=$HUBS_URL
CMD node -e "console.log(JSON.stringify('$EXTERNAL_SCRIPTS'.split(',')))" > external-scripts.json && \
	npm install $(node -e "console.log('$EXTERNAL_SCRIPTS'.split(',').join(' '))") && \
	ln -s /home/hubot/hubot-rocketchat /home/hubot/node_modules/hubot-rocketchat && \
	node_modules/.bin/hubot -n $BOT_NAME -a rocketchat
