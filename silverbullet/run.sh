#!/usr/bin/with-contenv bashio
set +u

bashio::log.info "Starting SilverBullet service."

silverbullet /data -L 0.0.0.0 -p 8099
