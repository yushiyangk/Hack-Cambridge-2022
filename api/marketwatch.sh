#!/bin/bash
if [ "$#" -ne 1 ]; then
  echo "Needs one argument"
  exit 1
fi

curl -s https://www.marketwatch.com/investing/stock/"$1" | \
  grep mw_quote_competitors | \
  sed -e 's/.*stock\/\(.*\)?.*competitors\">\(.*\)<\/a>.*/\1 : \2/'
  # symbol : company
