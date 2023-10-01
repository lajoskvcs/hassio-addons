#!/usr/bin/with-contenv bashio
set +u

bashio::log.info "Starting Digital Ocean DNS updater service."
npm run start
