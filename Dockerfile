# Use lightweight web server image
FROM node:alpine

# Create app directory
WORKDIR /app

# Copy all chatbot files into the container
COPY . .

# Install http-server
RUN npm install -g http-server

# Expose port
EXPOSE 8080

# Start server
CMD ["http-server", "-p", "8080"]
