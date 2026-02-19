#!/bin/bash
set -e

HOST="${AEROSPIKE_HOST:-aerospike-node-1}"
PORT="${AEROSPIKE_PORT:-3000}"
NS="test"
SET="sample_set"
TOTAL=1234

# Data pools for variety
categories=(electronics books clothing food sports music toys health automotive garden)
statuses=(active inactive pending archived draft)
cities=(Seoul Tokyo NewYork London Paris Berlin Sydney Toronto Mumbai Beijing)
colors=(red blue green yellow purple orange black white pink gray)
first_names=(Alice Bob Charlie Diana Eve Frank Grace Henry Ivy Jack)
last_names=(Kim Lee Park Choi Jung Kang Cho Yoon Jang Lim)

echo "========================================="
echo "  Aerospike Seed Data"
echo "  ${NS}.${SET} - ${TOTAL} records"
echo "  + Secondary Indexes + Lua UDFs"
echo "========================================="

# [1/5] Wait for Aerospike cluster
echo ""
echo "[1/5] Waiting for Aerospike cluster..."
for attempt in $(seq 1 30); do
  if aql -h "$HOST" -p "$PORT" -c "SHOW NAMESPACES" >/dev/null 2>&1; then
    echo "  Aerospike is ready."
    break
  fi
  if [ "$attempt" -eq 30 ]; then
    echo "  ERROR: Aerospike not available after 60s"
    exit 1
  fi
  sleep 2
done

# [2/5] Generate INSERT statements
echo ""
echo "[2/5] Generating ${TOTAL} records..."
BATCH="/tmp/seed.aql"
> "$BATCH"

for i in $(seq 1 $TOTAL); do
  ci=$(( (i - 1) % 10 ))
  si=$(( (i - 1) % 5 ))
  li=$(( (i + 2) % 10 ))
  oi=$(( (i + 4) % 10 ))
  ni=$(( (i + 6) % 10 ))
  lni=$(( (i + 8) % 10 ))

  category="${categories[$ci]}"
  status="${statuses[$si]}"
  city="${cities[$li]}"
  color="${colors[$oi]}"
  fname="${first_names[$ni]}"
  lname="${last_names[$lni]}"

  # Integer bin
  int_val=$(( i * 13 + 42 ))

  # String bin
  str_val="${fname} ${lname}"

  # Double bin
  dbl_val="$(( (i * 37 + 5) % 10000 )).$(( i % 100 ))"

  # Boolean bin (0 or 1, stored as integer)
  bool_val=$(( i % 2 ))

  # List bin: mixed types [int, string, double, int]
  list_val="[${int_val}, \"${color}\", ${dbl_val}, $(( i % 3 ))]"

  # Map bin: nested object with various fields
  age=$(( (i % 50) + 18 ))
  map_val="{\"first_name\":\"${fname}\",\"last_name\":\"${lname}\",\"category\":\"${category}\",\"status\":\"${status}\",\"city\":\"${city}\",\"age\":${age},\"score\":${int_val},\"tags\":[\"${color}\",\"${category}\"]}"

  # GeoJSON bin: worldwide coordinates
  lon="$(( (i * 47 % 361) - 180 )).$(( (i * 131) % 10000 ))"
  lat="$(( (i * 31 % 181) - 90 )).$(( (i * 173) % 10000 ))"
  geo_val="{\"type\":\"Point\",\"coordinates\":[${lon},${lat}]}"

  echo "INSERT INTO ${NS}.${SET} (PK, bin_int, bin_str, bin_double, bin_bool, bin_list, bin_map, bin_geojson) VALUES (${i}, ${int_val}, '${str_val}', ${dbl_val}, ${bool_val}, JSON('${list_val}'), JSON('${map_val}'), GEOJSON('${geo_val}'))" >> "$BATCH"

  if [ $(( i % 250 )) -eq 0 ]; then
    echo "  ${i}/${TOTAL} generated..."
  fi
done
echo "  ${TOTAL}/${TOTAL} generated."

# [3/5] Execute batch insert
echo ""
echo "[3/5] Inserting records into Aerospike..."
aql -h "$HOST" -p "$PORT" -f "$BATCH" > /dev/null 2>&1
echo "  Records inserted."

# [4/5] Create secondary indexes (via asinfo since aql 9.x removed CREATE INDEX)
echo ""
echo "[4/5] Creating secondary indexes..."

asinfo -h "$HOST" -p "$PORT" -v "sindex-create:ns=${NS};set=${SET};indexname=idx_bin_int;indexdata=bin_int,numeric" 2>&1 || true
echo "  idx_bin_int      (NUMERIC on bin_int)"

asinfo -h "$HOST" -p "$PORT" -v "sindex-create:ns=${NS};set=${SET};indexname=idx_bin_str;indexdata=bin_str,string" 2>&1 || true
echo "  idx_bin_str      (STRING on bin_str)"

asinfo -h "$HOST" -p "$PORT" -v "sindex-create:ns=${NS};set=${SET};indexname=idx_bin_double;indexdata=bin_double,numeric" 2>&1 || true
echo "  idx_bin_double   (NUMERIC on bin_double)"

asinfo -h "$HOST" -p "$PORT" -v "sindex-create:ns=${NS};set=${SET};indexname=idx_bin_bool;indexdata=bin_bool,numeric" 2>&1 || true
echo "  idx_bin_bool     (NUMERIC on bin_bool)"

asinfo -h "$HOST" -p "$PORT" -v "sindex-create:ns=${NS};set=${SET};indexname=idx_bin_geojson;indexdata=bin_geojson,geo2dsphere" 2>&1 || true
echo "  idx_bin_geojson  (GEO2DSPHERE on bin_geojson)"

echo "  5 secondary indexes created."

# [5/5] Register Lua UDFs
echo ""
echo "[5/5] Registering Lua UDF modules..."

LUA_DIR="/lua"
for lua_file in "$LUA_DIR"/*.lua; do
  if [ -f "$lua_file" ]; then
    filename=$(basename "$lua_file")
    aql -h "$HOST" -p "$PORT" -c "REGISTER MODULE '${lua_file}'" 2>&1 | grep -v "^$" || true
    echo "  ${filename}"
  fi
done

echo "  Lua UDFs registered."

echo ""
echo "========================================="
echo "  Done! Seed data summary:"
echo "  Records:  ${TOTAL} in ${NS}.${SET}"
echo ""
echo "  Bins:"
echo "    bin_int     (Integer)"
echo "    bin_str     (String)"
echo "    bin_double  (Double)"
echo "    bin_bool    (Boolean/Int)"
echo "    bin_list    (List)"
echo "    bin_map     (Map)"
echo "    bin_geojson (GeoJSON)"
echo ""
echo "  Secondary Indexes:"
echo "    idx_bin_int     NUMERIC"
echo "    idx_bin_str     STRING"
echo "    idx_bin_double  NUMERIC"
echo "    idx_bin_bool    NUMERIC"
echo "    idx_bin_geojson GEO2DSPHERE"
echo ""
echo "  Lua UDFs:"
echo "    record_utils.lua  (get_full_name, update_score, toggle_bool, ...)"
echo "    aggregation.lua   (sum_int, sum_double, count_by_category, avg_int)"
echo "    filter_utils.lua  (in_range, has_city, filter_above, ...)"
echo "    string_ops.lua    (to_upper, to_lower, str_contains, ...)"
echo "    math_ops.lua      (calc_percentage, normalize, statistics, ...)"
echo "========================================="
