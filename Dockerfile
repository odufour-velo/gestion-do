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

# --- Release/Clasp Stage ---
FROM base as release
RUN npm install -g @google/clasp
COPY . .
ENTRYPOINT ["clasp"]
