# --- Base Stage ---
FROM node:lts-slim as base
WORKDIR /app
COPY package*.json ./
RUN npm install

# --- Test Stage ---
FROM base as test
COPY . .
# Runs npm test (jest) and exits with the result
CMD ["npm", "test"]

# --- Dev Stage (for local testing) ---
FROM base as dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "server"]

# --- Release/Clasp Stage ---
FROM base as release
RUN npm install -g @google/clasp
COPY . .
ENTRYPOINT ["clasp"]
