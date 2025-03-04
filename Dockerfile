FROM node:alpine3.18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Ensure uploads and temp directories are created
RUN mkdir -p uploads temp/Compressed
# Add this after COPY package*.json ./
EXPOSE 3500
CMD [ "npm", "run", "start" ]