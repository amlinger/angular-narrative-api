#!/bin/bash

grunt docs

if [ -z "$(git status --porcelain)" ]; then
  echo "needs not be pushed"
else
  echo "NEEDS TO BE PUSHED"
fi
