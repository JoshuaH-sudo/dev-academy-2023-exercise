#!/bin/bash
DATASETS_PATH="$PWD/datasets"
JOURNEY_DIR="$JOURNEY_DATASETS/journeys"

if [ "$(ls -A $JOURNEY_DIR)" ]; then
  echo "Jounrey datasets already exists, skipping extraction"
else
  echo "$JOURNEY_DIR is Empty, extracting journey datasets"
  tar xvf $DATASETS_PATH/journey_datasets.tar.bz2 -C .
fi

STATIONS_DIR="$STATIONS_DATASETS/stations"
if [ "$(ls -A $STATIONS_DIR)" ]; then
  echo "Stations datasets already exists, skipping extraction"
else
  echo "$STATIONS_DIR is Empty, extracting journey datasets"
  tar xvf $DATASETS_PATH/station_datasets.tar.bz2 -C .
fi