# Start with a modern Node.js image
FROM node:20-slim

# Install system dependencies for ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp globally using pip
RUN pip3 install yt-dlp

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files and install Node.js dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 5001

# The command to run your application
CMD [ "node", "server.js" ]