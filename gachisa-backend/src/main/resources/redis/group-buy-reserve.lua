local current = redis.call('GET', KEYS[1])
if not current then
  current = tonumber(ARGV[2])
  redis.call('SET', KEYS[1], current)
else
  current = tonumber(current)
end

local target = tonumber(ARGV[1])
local quantity = tonumber(ARGV[3])

if quantity < 1 then
  return -2
end

if current + quantity > target then
  return -1
end

return redis.call('INCRBY', KEYS[1], quantity)
