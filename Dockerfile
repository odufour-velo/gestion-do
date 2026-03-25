# --- Base Stage ---
FROM node:18-slim as base
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
COPY start.sh .
RUN chmod +x start.sh
EXPOSE 3000
CMD ["bash", "start.sh"]

# --- Release/Clasp Stage ---
FROM base as release
RUN npm install -g @google/clasp
COPY . .
ENTRYPOINT ["clasp"]
