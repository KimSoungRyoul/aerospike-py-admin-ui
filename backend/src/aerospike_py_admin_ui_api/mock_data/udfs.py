from aerospike_py_admin_ui_api.models.udf import UDFModule

RECORD_UDF_SOURCE = """\
-- record_udf.lua
-- Basic record operations for Aerospike UDF

-- Get a specific bin value from a record
function get_bin(rec, bin_name)
  if aerospike:exists(rec) then
    return rec[bin_name]
  else
    return nil
  end
end

-- Set a bin value on a record and update it
function set_bin(rec, bin_name, value)
  if not aerospike:exists(rec) then
    aerospike:create(rec)
  end
  rec[bin_name] = value
  aerospike:update(rec)
  return 0
end

-- Delete a specific bin from a record
function delete_bin(rec, bin_name)
  if aerospike:exists(rec) then
    rec[bin_name] = nil
    aerospike:update(rec)
    return 0
  end
  return 1
end

-- Increment a numeric bin by a given amount
function increment_bin(rec, bin_name, amount)
  if not aerospike:exists(rec) then
    aerospike:create(rec)
    rec[bin_name] = amount
  else
    local current = rec[bin_name]
    if type(current) == "number" then
      rec[bin_name] = current + amount
    else
      rec[bin_name] = amount
    end
  end
  aerospike:update(rec)
  return rec[bin_name]
end

-- Conditionally update a bin only if the record generation matches
function cas_update(rec, bin_name, value, expected_gen)
  if aerospike:exists(rec) then
    local gen = record.gen(rec)
    if gen == expected_gen then
      rec[bin_name] = value
      aerospike:update(rec)
      return 0  -- success
    else
      return 1  -- generation mismatch
    end
  end
  return 2  -- record not found
end
"""

AGGREGATION_UDF_SOURCE = """\
-- aggregation.lua
-- Aggregation functions for Aerospike stream UDFs

local exports = {}

-- Map function: extract a single bin value from each record
local function map_bin(rec, bin_name)
  return rec[bin_name]
end

-- Sum aggregation for a numeric bin across all records in a stream
function exports.sum_bin(stream, bin_name)
  local function map_val(rec)
    local v = rec[bin_name]
    if type(v) == "number" then
      return v
    end
    return 0
  end

  local function add(a, b)
    return a + b
  end

  return stream : map(map_val) : reduce(add)
end

-- Average aggregation using a two-pass approach (sum + count)
function exports.avg_bin(stream, bin_name)
  local function map_val(rec)
    local v = rec[bin_name]
    if type(v) == "number" then
      return map { sum = v, count = 1 }
    end
    return map { sum = 0, count = 0 }
  end

  local function merge(a, b)
    return map {
      sum   = a["sum"]   + b["sum"],
      count = a["count"] + b["count"]
    }
  end

  local function final_reduce(a, b)
    return map {
      sum   = a["sum"]   + b["sum"],
      count = a["count"] + b["count"]
    }
  end

  return stream : map(map_val) : reduce(final_reduce)
end

-- Count records matching a bin predicate
function exports.count_where(stream, bin_name, op, threshold)
  local function filter_fn(rec)
    local v = rec[bin_name]
    if type(v) ~= "number" then
      return false
    end
    if op == "gt" then return v > threshold end
    if op == "lt" then return v < threshold end
    if op == "eq" then return v == threshold end
    if op == "gte" then return v >= threshold end
    if op == "lte" then return v <= threshold end
    return false
  end

  local function one(_rec)
    return 1
  end

  local function add(a, b)
    return a + b
  end

  return stream : filter(filter_fn) : map(one) : reduce(add)
end

-- Group-by aggregation: returns a map of { group_key => count }
function exports.group_count(stream, bin_name)
  local function accumulate(result, rec)
    local key = tostring(rec[bin_name])
    if result[key] then
      result[key] = result[key] + 1
    else
      result[key] = 1
    end
    return result
  end

  local function merge_maps(a, b)
    for k, v in pairs(b) do
      if a[k] then
        a[k] = a[k] + v
      else
        a[k] = v
      end
    end
    return a
  end

  return stream : aggregate(map {}, accumulate) : reduce(merge_maps)
end

return exports
"""


def _mock_hash(content: str) -> str:
    base = "abcdef0123456789"
    seed = 0
    for ch in content:
        seed = (seed * 31 + ord(ch)) & 0x7FFFFFFF
    result = []
    for _ in range(64):
        seed = (seed * 1103515245 + 12345) & 0x7FFFFFFF
        result.append(base[seed % 16])
    return "".join(result)


mock_udfs: dict[str, list[UDFModule]] = {
    "conn-1": [
        UDFModule(filename="record_udf.lua", type="LUA", hash=_mock_hash(RECORD_UDF_SOURCE), content=RECORD_UDF_SOURCE),
        UDFModule(
            filename="aggregation.lua",
            type="LUA",
            hash=_mock_hash(AGGREGATION_UDF_SOURCE),
            content=AGGREGATION_UDF_SOURCE,
        ),
    ],
    "conn-2": [
        UDFModule(filename="record_udf.lua", type="LUA", hash=_mock_hash(RECORD_UDF_SOURCE), content=RECORD_UDF_SOURCE),
        UDFModule(
            filename="aggregation.lua",
            type="LUA",
            hash=_mock_hash(AGGREGATION_UDF_SOURCE),
            content=AGGREGATION_UDF_SOURCE,
        ),
    ],
}
