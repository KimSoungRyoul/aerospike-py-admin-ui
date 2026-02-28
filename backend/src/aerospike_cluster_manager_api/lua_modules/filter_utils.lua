-- filter_utils.lua
-- Filter and predicate UDF functions

-- Check if bin_int falls within a given range
function in_range(rec, min_val, max_val)
  local val = rec["bin_int"]
  if val == nil then return false end
  return val >= min_val and val <= max_val
end

-- Check if bin_map contains a specific city
function has_city(rec, city)
  local m = rec["bin_map"]
  if m == nil then return false end
  return m["city"] == city
end

-- Check if bin_map category matches
function has_category(rec, category)
  local m = rec["bin_map"]
  if m == nil then return false end
  return m["category"] == category
end

-- Check if bin_bool equals a specific value
function is_active(rec)
  return rec["bin_bool"] == 1
end

-- Stream UDF: filter and return records where bin_int > threshold
function filter_above(stream, threshold)
  local function above(rec)
    local val = rec["bin_int"]
    return val ~= nil and val > threshold
  end

  local function to_map(rec)
    return map {
      bin_int = rec["bin_int"],
      bin_str = rec["bin_str"],
      bin_bool = rec["bin_bool"]
    }
  end

  return stream : filter(above) : map(to_map)
end
