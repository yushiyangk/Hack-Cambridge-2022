#!/bin/bash
if [ "$#" -ne 1 ]; then
  echo "Needs one argument"
  exit 1
fi

score=$(curl -s -L https://www.csrhub.com/CSR_and_sustainability_information/"$1" | \
  grep data-overall | \
  sed -e 's/.*data-overall-ratio-big-circle=\"\(.*\)\" data-overall-ratio.*/\1/')
if [ -z "$score" ] ; then
  echo "-1"
else
  echo "$score"
fi
