#!/usr/bin/env bash

INPUT="$(cat)"
FILENAME=README.md

START=$(echo "$INPUT" | awk '/\-\-\-\-\-/{ print NR; exit }')

END=$(echo "$INPUT" | awk '/All files/{ print NR; exit }')
END=$((END + 1))

COVERAGE=$(echo "$INPUT" | sed -n "${START},${END}p")

BEFORE=$(cat "$FILENAME" | sed '/COVERAGE START/,$d')
AFTER=$(cat "$FILENAME" | sed '1,/COVERAGE END/d')

echo "$BEFORE"
echo ""
echo "<!-- COVERAGE START -->"
echo ""
echo '```'
echo "$COVERAGE"
echo '```'
echo ""
echo "<!-- COVERAGE END -->"
echo "$AFTER"