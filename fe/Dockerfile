FROM node:22-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY . .

ARG VITE_BASE_URL

ENV VITE_BASE_URL=$VITE_BASE_URL

RUN npm run build

EXPOSE 4173

CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]