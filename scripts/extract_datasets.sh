#!/bin/bash
DATASETS_PATH="$PWD/datasets"

JOURNEY_DIR="$DATASETS_PATH/journeys"
# Create the directory if it doesn't exist
mkdir -p $JOURNEY_DIR
# Check if the directory is empty
if [ "$(ls -A $JOURNEY_DIR)" ]; then
  echo "Jounrey datasets already exists, skipping extraction"
else
  echo "$JOURNEY_DIR is Empty, extracting journey datasets"

  tar xvf $DATASETS_PATH/journey_datasets.tar.bz2 -C .
fi

STATIONS_DIR="$DATASETS_PATH/stations"

mkdir -p $STATIONS_DIR
if [ "$(ls -A $STATIONS_DIR)" ]; then
  echo "Station datasets already exists, skipping extraction"
else
  echo "$STATIONS_DIR is Empty, extracting station datasets"

  tar xvf $DATASETS_PATH/station_datasets.tar.bz2 -C .
fi
