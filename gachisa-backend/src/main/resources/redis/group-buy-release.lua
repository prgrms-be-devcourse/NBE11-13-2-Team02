if redis.call('EXISTS', KEYS[1]) == 0 then
  return -1
end

local current = tonumber(redis.call('GET', KEYS[1]))
local quantity = tonumber(ARGV[1])

if quantity < 1 then
  return current
end

local next = current - quantity
if next < 0 then
  next = 0
end

redis.call('SET', KEYS[1], next)
return next
