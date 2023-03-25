#!/usr/bin/with-contenv bashio
set +u

export EXAMPLE_ENV_VAR=$(bashio::config 'example_env_var')
bashio::log.info "Environemnt variable configured as ${EXAMPLE_ENV_VAR}."

bashio::log.info "Starting example service."
npm run start
