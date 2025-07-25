FROM node:18.20.3-slim

WORKDIR /app

# Copy root package.json first
COPY package*.json ./
RUN npm install

# Copy backend package.json and install backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend

# Copy frontend package.json and install frontend dependencies
COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend

# Copy all source code
COPY . .

# Expose the port
EXPOSE $PORT

# Use production start command
CMD ["npm", "start"]
