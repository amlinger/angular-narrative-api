#!/bin/bash

DOC_FOLDER=docs/

# Making Grunt be quiet.
grunt docs > /dev/null

if [ -z "$(git status --porcelain $DOC_FOLDER)" ]; then
  exit 0
else
  BRANCH="$(git name-rev --name-only HEAD)"
  git checkout -b temp-gh-branch
  git add $DOC_FOLDER && git commit -m "Updated documentation"
  git subtree push --prefix $DOC_FOLDER "https://${GH_TOKEN}@${GH_REF}" origin:gh-pages
  git checkout $BRANCH
  git branch -d temp-gh-branch

  exit 0
fi
