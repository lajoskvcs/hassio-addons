FROM ghcr.io/sytone/obsidian-remote:latest

# Set environment variables
ENV TZ="UTC"
ENV DOCKER_MODS=linuxserver/mods:universal-git
ENV TITLE="Obsidian"
# Set environment variable for port from the configuration
ENV CUSTOM_PORT=$PORT

# Expose the dynamic port set in the configuration
EXPOSE ${PORT}

# Define volumes for storing vaults and configuration
VOLUME [ "/vaults", "/config" ]

ENTRYPOINT ["/init"]
