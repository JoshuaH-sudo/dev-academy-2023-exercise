#!/bin/bash
mkdir -p ./public
if [ "$(ls -A public)" ]; then
  rm -R ./public/*
else 
  echo public directory is empty
fi


echo "Running $NODE_ENV build"
if [ "$NODE_ENV" == "development" ]; then
  yarn webpack --config ./scripts/webpack/webpack.dev.js --mode development
elif [ "$NODE_ENV" == "production" ]; then
  yarn webpack --config ./scripts/webpack/webpack.prod.js --mode production
else
  echo 'No build mode selected set the NODE_ENV variable to either "development" or "production"'
  exit 1
fi

sleep 4