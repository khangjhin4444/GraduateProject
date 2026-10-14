FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

ARG VITE_PROD=false

ENV VITE_PROD=$VITE_PROD

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]