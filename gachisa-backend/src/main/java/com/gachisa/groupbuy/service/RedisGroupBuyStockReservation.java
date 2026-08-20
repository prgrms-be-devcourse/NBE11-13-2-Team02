package com.gachisa.groupbuy.service;

import com.gachisa.groupbuy.entity.GroupBuy;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class RedisGroupBuyStockReservation implements GroupBuyStockReservation {

    private static final DefaultRedisScript<Long> RESERVE_SCRIPT =
            loadScript("redis/group-buy-reserve.lua", Long.class);
    private static final DefaultRedisScript<Long> RELEASE_SCRIPT =
            loadScript("redis/group-buy-release.lua", Long.class);

    private final StringRedisTemplate redisTemplate;

    private static <T> DefaultRedisScript<T> loadScript(String path, Class<T> resultType) {
        DefaultRedisScript<T> script = new DefaultRedisScript<>();
        script.setLocation(new ClassPathResource(path));
        script.setResultType(resultType);
        return script;
    }

    @Override
    public boolean tryReserve(GroupBuy groupBuy, int quantity) {
        Long result = redisTemplate.execute(
                RESERVE_SCRIPT,
                List.of(stockKey(groupBuy.getId())),
                groupBuy.getTargetCount().toString(),
                groupBuy.getCurrentCount().toString(),
                Integer.toString(quantity)
        );
        return result != null && result >= 0;
    }

    @Override
    public void release(Long groupBuyId, int quantity) {
        redisTemplate.execute(
                RELEASE_SCRIPT,
                List.of(stockKey(groupBuyId)),
                Integer.toString(quantity)
        );
    }

    @Override
    public Long getReservedCount(Long groupBuyId) {
        String value = redisTemplate.opsForValue().get(stockKey(groupBuyId));
        return value == null ? null : Long.valueOf(value);
    }

    private String stockKey(Long groupBuyId) {
        return "group-buy:stock:" + groupBuyId;
    }
}
