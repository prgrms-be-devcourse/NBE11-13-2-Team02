package com.gachisa.participation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.gachisa.category.entity.Category;
import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.service.GroupBuyService;
import com.gachisa.groupbuy.service.GroupBuyStockReservation;
import com.gachisa.participation.dto.ParticipationCreateRequest;
import com.gachisa.participation.entity.Participation;
import com.gachisa.participation.repository.ParticipationRepository;
import com.gachisa.product.entity.Product;
import com.gachisa.product.entity.ProductStatus;
import com.gachisa.user.entity.User;
import com.gachisa.user.entity.UserRole;
import com.gachisa.user.repository.UserRepository;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ParticipationServiceConcurrencyTest {

    private static final Long GROUP_BUY_ID = 1L;
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 20, 12, 0);

    @Mock
    private ParticipationRepository participationRepository;

    @Mock
    private GroupBuyService groupBuyService;

    @Mock
    private UserRepository userRepository;

    private InMemoryGroupBuyStockReservation stockReservation;
    private ParticipationService participationService;
    private GroupBuy groupBuy;

    @BeforeEach
    void setUp() {
        stockReservation = new InMemoryGroupBuyStockReservation();
        participationService = new ParticipationService(
                participationRepository, groupBuyService, stockReservation, userRepository);
        groupBuy = groupBuyWithOnlyTwoSlotsLeft();
    }

    @Test
    void onlyTwoUsersSucceedWhenHundredUsersParticipateAtSameTime() throws Exception {
        AtomicLong participationId = new AtomicLong();
        given(userRepository.findById(anyLong()))
                .willAnswer(invocation -> Optional.of(buyer(invocation.getArgument(0))));
        given(groupBuyService.getGroupBuyEntityOrThrow(GROUP_BUY_ID)).willReturn(groupBuy);
        given(groupBuyService.reserveSlots(GROUP_BUY_ID, 1)).willAnswer(invocation -> {
            synchronized (groupBuy) {
                groupBuy.reserve(1);
                return groupBuy;
            }
        });
        given(participationRepository.save(any(Participation.class))).willAnswer(invocation -> {
            Participation participation = invocation.getArgument(0);
            ReflectionTestUtils.setField(participation, "id", participationId.incrementAndGet());
            return participation;
        });

        int requestCount = 100;
        CountDownLatch ready = new CountDownLatch(requestCount);
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(requestCount);
        AtomicInteger successCount = new AtomicInteger();
        AtomicInteger fullCount = new AtomicInteger();
        AtomicReference<Throwable> unexpected = new AtomicReference<>();
        ExecutorService executor = Executors.newFixedThreadPool(requestCount);

        try {
            for (int index = 0; index < requestCount; index++) {
                long userId = index + 1L;
                executor.submit(() -> {
                    ready.countDown();
                    try {
                        start.await();
                        participationService.participate(GROUP_BUY_ID, userId, request(1));
                        successCount.incrementAndGet();
                    } catch (CustomException e) {
                        if (e.getErrorCode() == ErrorCode.GROUP_BUY_FULL) {
                            fullCount.incrementAndGet();
                        } else {
                            unexpected.compareAndSet(null, e);
                        }
                    } catch (Throwable e) {
                        unexpected.compareAndSet(null, e);
                    } finally {
                        done.countDown();
                    }
                });
            }

            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(done.await(10, TimeUnit.SECONDS)).isTrue();
        } finally {
            executor.shutdownNow();
        }

        assertThat(unexpected.get()).isNull();
        assertThat(successCount.get()).isEqualTo(2);
        assertThat(fullCount.get()).isEqualTo(98);
        assertThat(groupBuy.getCurrentCount()).isEqualTo(100);
        assertThat(stockReservation.getReservedCount(GROUP_BUY_ID)).isEqualTo(100L);
        verify(participationRepository, times(2)).save(any(Participation.class));
    }

    private ParticipationCreateRequest request(int quantity) {
        ParticipationCreateRequest request = new ParticipationCreateRequest();
        ReflectionTestUtils.setField(request, "quantity", quantity);
        return request;
    }

    private GroupBuy groupBuyWithOnlyTwoSlotsLeft() {
        GroupBuy groupBuy = GroupBuy.builder()
                .product(product())
                .targetCount(100)
                .discountRate(BigDecimal.valueOf(0.1))
                .openAt(NOW.minusHours(1))
                .deadline(NOW.plusMinutes(1))
                .sellerId(10L)
                .build();
        ReflectionTestUtils.setField(groupBuy, "id", GROUP_BUY_ID);
        ReflectionTestUtils.setField(groupBuy, "currentCount", 98);
        return groupBuy;
    }

    private Product product() {
        Product product = Product.builder()
                .seller(buyer(10L))
                .category(category())
                .name("동시성 테스트 상품")
                .description("재고 2개 남은 공동구매")
                .basePrice(10_000)
                .stock(100)
                .imageUrl(null)
                .status(ProductStatus.ON_SALE)
                .createdAt(NOW)
                .build();
        ReflectionTestUtils.setField(product, "id", 1L);
        return product;
    }

    private Category category() {
        Category category = Category.builder().name("테스트").parent(null).build();
        ReflectionTestUtils.setField(category, "id", 1L);
        return category;
    }

    private User buyer(Long id) {
        User user = User.builder()
                .email(id + "@test.com")
                .password("encoded")
                .name("구매자" + id)
                .role(UserRole.ROLE_BUYER)
                .createdAt(NOW)
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static class InMemoryGroupBuyStockReservation implements GroupBuyStockReservation {

        private final ConcurrentHashMap<Long, AtomicInteger> counts = new ConcurrentHashMap<>();

        @Override
        public boolean tryReserve(GroupBuy groupBuy, int quantity) {
            AtomicInteger count = counts.computeIfAbsent(
                    groupBuy.getId(), ignored -> new AtomicInteger(groupBuy.getCurrentCount()));

            while (true) {
                int current = count.get();
                if (current + quantity > groupBuy.getTargetCount()) {
                    return false;
                }
                if (count.compareAndSet(current, current + quantity)) {
                    return true;
                }
            }
        }

        @Override
        public void release(Long groupBuyId, int quantity) {
            counts.computeIfPresent(groupBuyId, (ignored, count) -> {
                count.updateAndGet(current -> Math.max(0, current - quantity));
                return count;
            });
        }

        @Override
        public Long getReservedCount(Long groupBuyId) {
            AtomicInteger count = counts.get(groupBuyId);
            return count == null ? null : count.longValue();
        }
    }
}
