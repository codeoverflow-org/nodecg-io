# Base devcontainer for node.js development
FROM mcr.microsoft.com/vscode/devcontainers/typescript-node:0.205-bullseye
USER node

# Install required system dependencies
RUN sudo apt update && sudo apt-get -y install libusb-1.0-0-dev libasound2-dev libudev-dev libc-bin

# Create a NodeCG installation
WORKDIR /workspaces
RUN git clone https://github.com/nodecg/nodecg.git

# Install dependencies and add configuration that includes the nodecg-io install
RUN cd nodecg && npm install --prod && mkdir cfg
COPY ./nodecg.json /workspaces/nodecg/cfg/nodecg.json

