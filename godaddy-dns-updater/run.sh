#!/usr/bin/with-contenv bashio
set +u

bashio::log.info "Starting Godaddy DNS updater service."
npm run start
