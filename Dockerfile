FROM node:alpine3.18
WORKDIR /app
COPY package.json ./
# Ensure uploads and temp directories are created
RUN mkdir -p uploads temp/Compressed

RUN npm install
COPY . .
EXPOSE 3500
CMD [ "npm", "run", "start" ]