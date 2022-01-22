#!/bin/bash
if [ "$#" -ne 1 ]; then
  echo "Needs one argument"
  exit 1
fi

curl -s -L https://www.marketwatch.com/investing/stock/"$1" | \
  grep 'name="name"' | \
  sed -e 's/.*content=\"\(.*\)\".*/\1/'