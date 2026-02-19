-- record_utils.lua
-- Record-level UDF functions for common operations

-- Get the full name by reading bin_map's first_name + last_name
function get_full_name(rec)
  local m = rec["bin_map"]
  if m == nil then return nil end
  local first = m["first_name"] or ""
  local last = m["last_name"] or ""
  return first .. " " .. last
end

-- Update bin_int by adding a delta value
function update_score(rec, delta)
  if rec["bin_int"] == nil then return end
  rec["bin_int"] = rec["bin_int"] + delta
  aerospike:update(rec)
  return rec["bin_int"]
end

-- Toggle bin_bool between 0 and 1
function toggle_bool(rec)
  if rec["bin_bool"] == nil then return end
  if rec["bin_bool"] == 0 then
    rec["bin_bool"] = 1
  else
    rec["bin_bool"] = 0
  end
  aerospike:update(rec)
  return rec["bin_bool"]
end

-- Add a tag to bin_list
function add_tag(rec, tag)
  local lst = rec["bin_list"]
  if lst == nil then
    lst = list()
  end
  list.append(lst, tag)
  rec["bin_list"] = lst
  aerospike:update(rec)
  return lst
end

-- Set a key-value pair in bin_map
function set_map_field(rec, key, value)
  local m = rec["bin_map"]
  if m == nil then
    m = map()
  end
  m[key] = value
  rec["bin_map"] = m
  aerospike:update(rec)
  return m
end
