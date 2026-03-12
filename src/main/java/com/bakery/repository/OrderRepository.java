package com.bakery.repository;

import com.bakery.model.BakeryOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrderRepository extends JpaRepository<BakeryOrder, Long> {
    List<BakeryOrder> findByTableNumberOrderByOrderTimeDesc(String tableNumber);
}
