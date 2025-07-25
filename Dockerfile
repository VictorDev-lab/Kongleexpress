FROM node:18.20.3-slim

WORKDIR /app

# Copy root package.json first
COPY package*.json ./
RUN npm install

# Copy backend package.json and install backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend

# Copy frontend package.json and install frontend dependencies if it exists
COPY frontend/package*.json ./frontend/
RUN npm install --prefix frontend

# Copy backend source code
COPY backend/ ./backend/

# Copy frontend source code
COPY frontend/ ./frontend/

# Copy root files
COPY package.json package-lock.json ./

# Expose the port
EXPOSE $PORT

# Use production start command
CMD ["npm", "start"]
