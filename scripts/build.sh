#!/bin/bash

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
  echo "Node build mode selected"
fi