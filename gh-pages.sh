#!/bin/bash

git branch -D gh-pages
git checkout -b gh-pages
git add -f dist
git add -f src/livesplit_core.js
git commit -m "gh pages"
git push -f origin head
git checkout -
webpack
cp livesplit-core/js/livesplit.js src/livesplit_core.js
