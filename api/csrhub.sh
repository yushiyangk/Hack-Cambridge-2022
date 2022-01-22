#!/bin/bash
if [ "$#" -eq 0 ] ; then
  echo "Needs at least one argument"
  exit 1
fi

for company in "$@" ; do
  score=$(curl -s -L https://www.csrhub.com/CSR_and_sustainability_information/"$company" | \
    grep data-overall | \
    sed -e 's/.*data-overall-ratio-big-circle=\"\(.*\)\" data-overall-ratio.*/\1/')
  if [ -z "$score" ] ; then
    echo "-1"
  else
    echo "$score"
  fi
done
