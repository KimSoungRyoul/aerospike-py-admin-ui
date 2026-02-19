-- math_ops.lua
-- Mathematical and statistical UDF functions

-- Calculate percentage of bin_int relative to a max value
function calc_percentage(rec, max_val)
  local val = rec["bin_int"]
  if val == nil or max_val == 0 then return 0.0 end
  return (val / max_val) * 100.0
end

-- Normalize bin_double to a 0-1 range
function normalize(rec, min_val, max_val)
  local val = rec["bin_double"]
  if val == nil then return 0.0 end
  if max_val == min_val then return 0.0 end
  return (val - min_val) / (max_val - min_val)
end

-- Apply a multiplier to bin_int and update the record
function scale_int(rec, multiplier)
  local val = rec["bin_int"]
  if val == nil then return end
  rec["bin_int"] = math.floor(val * multiplier)
  aerospike:update(rec)
  return rec["bin_int"]
end

-- Compute the absolute difference between bin_int and bin_double
function abs_diff(rec)
  local int_val = rec["bin_int"] or 0
  local dbl_val = rec["bin_double"] or 0.0
  return math.abs(int_val - dbl_val)
end

-- Stream UDF: compute min, max, sum, count of bin_int
function statistics(stream)
  local function accumulate(result, rec)
    local val = rec["bin_int"]
    if val ~= nil then
      result["count"] = (result["count"] or 0) + 1
      result["sum"] = (result["sum"] or 0) + val
      if result["min"] == nil or val < result["min"] then
        result["min"] = val
      end
      if result["max"] == nil or val > result["max"] then
        result["max"] = val
      end
    end
    return result
  end

  local function merge(a, b)
    a["count"] = (a["count"] or 0) + (b["count"] or 0)
    a["sum"] = (a["sum"] or 0) + (b["sum"] or 0)
    if b["min"] ~= nil and (a["min"] == nil or b["min"] < a["min"]) then
      a["min"] = b["min"]
    end
    if b["max"] ~= nil and (a["max"] == nil or b["max"] > a["max"]) then
      a["max"] = b["max"]
    end
    return a
  end

  return stream : aggregate(map(), accumulate) : reduce(merge)
end
