FROM node:14-alpine
LABEL maintainer=CanDIG
ENV NODE_ENV=production

RUN apk update
RUN apk add nodejs bash git npm
USER node
WORKDIR /var/www

ADD package.json .

RUN npm install express
RUN npm install pug
RUN npm install helmet
RUN npm install compression
# RUN npm install igv
RUN npm install rollup
RUN npm install @rollup/plugin-node-resolve --save-dev

RUN git clone https://github.com/daisieh/igv.js.git
RUN cd igv.js; git checkout test-rollup; npm install; npm run build

ADD app.js .
COPY html /var/www/html
# RUN cp node_modules/igv/dist/igv.min.js html/assets/js/

ENTRYPOINT ["/usr/bin/node", "app.js"]
