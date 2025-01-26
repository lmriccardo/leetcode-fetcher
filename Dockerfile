FROM node:iron-alpine3.21

WORKDIR /usr/leetcode-fetcher/
COPY package*.json ./
RUN npm install -g npm
RUN npm install

COPY . .
RUN npm run build
RUN npm install -g .

RUN mkdir /leetcode
RUN chown node:node /leetcode

USER node
WORKDIR /leetcode

CMD [ "lcfetcher" ]