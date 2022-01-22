output=0

while getopts "o" opt
do
  case $opt in
  (o) output=1 ;;
  (*) exit 1 ;;
  esac
done

while read company; do
  score=$(curl -s -L https://www.csrhub.com/CSR_and_sustainability_information/"$company" \
    | grep data-overall \
    | sed -e 's/.*data-overall-ratio-big-circle=\"\(.*\)\" data-overall-ratio.*/\1/')
  if [ -z "$score" ] ; then
    echo "Could not get score."
  else
    if [ -n output ] ; then
      echo "$company": "$score"
    else
      echo "$score"
    fi
  fi
done < companies.txt
