FROM node:lts-hydrogen

WORKDIR /usr/local/apps/recs

COPY . .
RUN npm cache clean --force
RUN npm i

EXPOSE 4000

CMD ["npm", "run", "dev"]