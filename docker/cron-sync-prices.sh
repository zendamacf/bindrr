#!/bin/sh
set -eu
wget -q -O /dev/null --header="Authorization: Bearer ${CRON_SECRET}" http://app:3000/api/cron/sync-prices
