-- string_ops.lua
-- String manipulation UDF functions

-- Convert bin_str to uppercase
function to_upper(rec)
  local val = rec["bin_str"]
  if val == nil then return nil end
  return string.upper(val)
end

-- Convert bin_str to lowercase
function to_lower(rec)
  local val = rec["bin_str"]
  if val == nil then return nil end
  return string.lower(val)
end

-- Get string length of bin_str
function str_length(rec)
  local val = rec["bin_str"]
  if val == nil then return 0 end
  return string.len(val)
end

-- Check if bin_str contains a substring
function str_contains(rec, substr)
  local val = rec["bin_str"]
  if val == nil then return false end
  return string.find(val, substr) ~= nil
end

-- Format a summary string from multiple bins
function format_summary(rec)
  local name = rec["bin_str"] or "unknown"
  local score = rec["bin_int"] or 0
  local active = rec["bin_bool"] == 1 and "active" or "inactive"
  return string.format("%s (score: %d, %s)", name, score, active)
end
