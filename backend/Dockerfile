# Start with a Node.js 20 image (LTS version is more stable for deployment)
FROM node:20-slim

# Install system dependencies needed for ffmpeg and yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp using pip with the flag to override the environment protection
RUN pip3 install yt-dlp --break-system-packages

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 5001

# The command to run your application
CMD [ "node", "server.js" ]
