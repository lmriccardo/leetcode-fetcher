FROM node:iron-alpine3.21

WORKDIR /usr/leetcode-fetcher/
COPY package*.json ./
RUN npm install -g npm
RUN npm install

COPY . .

USER node

CMD [ "npm", "run", "app" ]