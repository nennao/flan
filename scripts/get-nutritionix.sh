#!/usr/bin/env bash

function get_nutrients() {
    local food="$1"
    curl -sL -X POST https://trackapi.nutritionix.com/v2/natural/nutrients \
        -d "{\"query\": \"$food\"}" \
        -H "Content-Type: application/json" \
        -H "X-App-ID: 37d64d9f" \
        -H "X-App-Key: 8b2a58a9d1142cfe8fcccbe99aec4236"
    return $?
}

function get_foods() {
    scripts/sql.sh -t -c "select name from foods"
}

export IFS=$'\n' # yuck tbh
for name in $(get_foods); do
    name2="${name:1:${#name}}"
    if [[ ! -z "$name2" ]]; then
        echo "Fetching $name2..."
        get_nutrients "$name2" > "data/$name2.json"
        if [[ $? != "0" ]]; then
            echo "error occurred"
        fi
    fi
done
