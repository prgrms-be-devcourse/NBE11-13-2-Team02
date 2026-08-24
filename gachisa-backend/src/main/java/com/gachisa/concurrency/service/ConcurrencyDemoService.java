package com.gachisa.concurrency.service;

import com.gachisa.concurrency.dto.ConcurrencyStressRequest;
import com.gachisa.concurrency.dto.ConcurrencyStressRequest.Mode;
import com.gachisa.concurrency.dto.ConcurrencyStressResponse;
import com.gachisa.global.exception.CustomException;
import com.gachisa.global.exception.ErrorCode;
import com.gachisa.groupbuy.entity.GroupBuy;
import com.gachisa.groupbuy.repository.GroupBuyRepository;
import com.gachisa.groupbuy.repository.GroupBuyStockRedisRepository;
import com.gachisa.groupbuy.service.GroupBuyService;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * 공동구매 정원 동시성 문제를 재현/검증하기 위한 로컬 스트레스 도구.
 * 실제 참여(Participation) 레코드는 만들지 않고 currentCount 예약만 경쟁시킨다.
 */
@Service
@Profile("local")
@RequiredArgsConstructor
public class ConcurrencyDemoService {

    private final GroupBuyRepository groupBuyRepository;
    private final GroupBuyStockRedisRepository stockRedisRepository;
    private final GroupBuyService groupBuyService;
    private final PlatformTransactionManager transactionManager;

    public ConcurrencyStressResponse run(Long groupBuyId, ConcurrencyStressRequest request) {
        GroupBuy snapshot = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));

        int originalCount = snapshot.getCurrentCount();
        int target = snapshot.getTargetCount();
        // 이미 마감된 공동구매에 다시 때리면 전부 GROUP_BUY_FULL 이라 성공 0이 된다.
        // 데모는 currentCount를 0으로 되돌린 뒤 같은 정원을 경쟁시킨다.
        resetStock(groupBuyId, 0, target);

        AtomicInteger success = new AtomicInteger();
        AtomicInteger rejectedAsFull = new AtomicInteger();
        AtomicInteger otherFailures = new AtomicInteger();
        CountDownLatch ready = new CountDownLatch(request.getThreadCount());
        CountDownLatch start = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(request.getThreadCount());

        ExecutorService pool = Executors.newFixedThreadPool(request.getThreadCount());
        List<Future<?>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < request.getThreadCount(); i++) {
                futures.add(pool.submit(() -> {
                    try {
                        ready.countDown();
                        start.await();
                        attemptReserve(groupBuyId, request.getQuantityPerRequest(), request.getMode());
                        success.incrementAndGet();
                    } catch (Exception ex) {
                        CustomException custom = unwrapCustomException(ex);
                        if (custom != null && custom.getErrorCode() == ErrorCode.GROUP_BUY_FULL) {
                            rejectedAsFull.incrementAndGet();
                        } else {
                            otherFailures.incrementAndGet();
                        }
                    } finally {
                        done.countDown();
                    }
                }));
            }

            if (!ready.await(10, TimeUnit.SECONDS)) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
            start.countDown();
            if (!done.await(60, TimeUnit.SECONDS)) {
                throw new CustomException(ErrorCode.INVALID_REQUEST);
            }
            for (Future<?> future : futures) {
                future.get(1, TimeUnit.SECONDS);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            throw new CustomException(ErrorCode.INVALID_REQUEST);
        } finally {
            pool.shutdownNow();
        }

        GroupBuy afterEntity = groupBuyRepository.findById(groupBuyId)
                .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
        int afterDb = afterEntity.getCurrentCount();
        Integer afterRedis = stockRedisRepository.getCurrentCount(groupBuyId).orElse(null);
        boolean oversold = afterDb > target;
        int failures = rejectedAsFull.get() + otherFailures.get();

        String summary;
        if (oversold) {
            summary = String.format("동시성 문제 재현: DB currentCount(%d) > targetCount(%d)", afterDb, target);
        } else {
            summary = String.format(
                    "정원 준수: 성공 %d / 정원초과거절 %d / 기타실패 %d (target %d)",
                    success.get(), rejectedAsFull.get(), otherFailures.get(), target);
        }

        return ConcurrencyStressResponse.builder()
                .mode(request.getMode())
                .groupBuyId(groupBuyId)
                .threadCount(request.getThreadCount())
                .quantityPerRequest(request.getQuantityPerRequest())
                .targetCount(target)
                .currentCountBefore(originalCount)
                .currentCountAfterDb(afterDb)
                .currentCountAfterRedis(afterRedis)
                .remainingSlotsAtStart(target)
                .successCount(success.get())
                .failureCount(failures)
                .rejectedAsFull(rejectedAsFull.get())
                .otherFailures(otherFailures.get())
                .oversold(oversold)
                .summary(summary)
                .build();
    }

    private void resetStock(Long groupBuyId, int currentCount, int targetCount) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            GroupBuy groupBuy = groupBuyRepository.findByIdForUpdate(groupBuyId)
                    .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
            groupBuy.resetCurrentCount(currentCount);
        });
        stockRedisRepository.overwrite(groupBuyId, currentCount, targetCount);
    }

    private void attemptReserve(Long groupBuyId, int quantity, Mode mode) {
        switch (mode) {
            case UNSAFE -> unsafeReserve(groupBuyId, quantity);
            case DB_LOCK -> dbLockReserve(groupBuyId, quantity);
            case REDIS_AND_DB -> groupBuyService.reserveSlots(groupBuyId, quantity);
        }
    }

    /** 의도적으로 락 없이 읽고 증가 — Lost Update / 초과 모집 재현용 */
    private void unsafeReserve(Long groupBuyId, int quantity) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            GroupBuy groupBuy = groupBuyRepository.findById(groupBuyId)
                    .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
            try {
                Thread.sleep(5);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            groupBuy.reserve(quantity);
        });
    }

    private void dbLockReserve(Long groupBuyId, int quantity) {
        TransactionTemplate tx = new TransactionTemplate(transactionManager);
        tx.executeWithoutResult(status -> {
            GroupBuy groupBuy = groupBuyRepository.findByIdForUpdate(groupBuyId)
                    .orElseThrow(() -> new CustomException(ErrorCode.GROUP_BUY_NOT_FOUND));
            groupBuy.reserve(quantity);
        });
    }

    private CustomException unwrapCustomException(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof CustomException custom) {
                return custom;
            }
            current = current.getCause();
        }
        return null;
    }
}
