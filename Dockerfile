# Use Node.js base image
FROM node:18-alpine

# Install http-server globally
RUN npm install -g http-server

# Create app directory
WORKDIR /app

# Copy all project files
COPY . .

# Expose port 8080
EXPOSE 8080

# Serve files using http-server
CMD ["http-server", ".", "-p", "8080"]
