-- aggregation.lua
-- Stream UDF functions for aggregation queries

local function add_int(a, b)
  return a + b
end

local function map_bin_int(rec)
  return rec["bin_int"] or 0
end

local function map_bin_double(rec)
  return rec["bin_double"] or 0.0
end

-- Sum of bin_int across all records
function sum_int(stream)
  return stream : map(map_bin_int) : reduce(add_int)
end

-- Sum of bin_double across all records
function sum_double(stream)
  return stream : map(map_bin_double) : reduce(add_int)
end

-- Count records grouped by category (from bin_map)
function count_by_category(stream)
  local function accumulate(result, rec)
    local m = rec["bin_map"]
    if m ~= nil and m["category"] ~= nil then
      local cat = m["category"]
      result[cat] = (result[cat] or 0) + 1
    end
    return result
  end

  local function merge(a, b)
    for k, v in map.pairs(b) do
      a[k] = (a[k] or 0) + v
    end
    return a
  end

  return stream : aggregate(map(), accumulate) : reduce(merge)
end

-- Average of bin_int (returns map with sum and count)
function avg_int(stream)
  local function accumulate(result, rec)
    local val = rec["bin_int"]
    if val ~= nil then
      result["sum"] = (result["sum"] or 0) + val
      result["count"] = (result["count"] or 0) + 1
    end
    return result
  end

  local function merge(a, b)
    a["sum"] = (a["sum"] or 0) + (b["sum"] or 0)
    a["count"] = (a["count"] or 0) + (b["count"] or 0)
    return a
  end

  return stream : aggregate(map(), accumulate) : reduce(merge)
end
