package com.bakery.repository;

import com.bakery.model.BakeryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<BakeryOrder, Long> {
    List<BakeryOrder> findByTableNumberOrderByOrderTimeDesc(String tableNumber);

    /** Returns true if any order already has the given screenshot hash (duplicate detection) */
    boolean existsByScreenshotHash(String screenshotHash);

    /** Returns true if any order already has the given UPI Reference ID (duplicate UTR detection) */
    boolean existsByUpiReferenceId(String upiReferenceId);
}
