package com.bakery.config;

import com.bakery.model.MenuItem;
import com.bakery.repository.MenuItemRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class DataInitializer {

        @Bean
        CommandLineRunner initDatabase(MenuItemRepository repository) {
                return args -> {
                        if (repository.count() == 0) {
                                MenuItem item1 = new MenuItem();
                                item1.setName("Manapparai Murukku (250g)");
                                item1.setDescription(
                                                "Crunchy, traditional rice flour murukku made with authentic Manapparai style.");
                                item1.setPrice(90.00);
                                item1.setCategory("Savories");
                                item1.setImageUrl("");

                                MenuItem item2 = new MenuItem();
                                item2.setName("Traditional Adhirasam (5 pcs)");
                                item2.setDescription(
                                                "Deep-fried jaggery and rice flour sweet, a Tamil Nadu festival classic.");
                                item2.setPrice(120.00);
                                item2.setCategory("Sweets");
                                item2.setImageUrl("");

                                MenuItem item3 = new MenuItem();
                                item3.setName("Ribbon Pakoda (200g)");
                                item3.setDescription("Crispy golden ribbons of fried chickpea flour, mildly spiced.");
                                item3.setPrice(75.00);
                                item3.setCategory("Savories");
                                item3.setImageUrl("");

                                MenuItem item4 = new MenuItem();
                                item4.setName("Kai Murukku (Manual Twist)");
                                item4.setDescription("Expertly hand-twisted murukku, extra crunchy and flavorful.");
                                item4.setPrice(40.00);
                                item4.setCategory("Savories");
                                item4.setImageUrl("");

                                MenuItem item5 = new MenuItem();
                                item5.setName("Kaara Boondhi (200g)");
                                item5.setDescription("Spicy, crispy boondhi mixed with peanuts and curry leaves.");
                                item5.setPrice(65.00);
                                item5.setCategory("Savories");
                                item5.setImageUrl("");

                                MenuItem combo1 = new MenuItem();
                                combo1.setName("Grand Festival Combo");
                                combo1.setDescription("500g Athirasam + 500g Manapparai Murukku + 250g Mixture.");
                                combo1.setPrice(450.00);
                                combo1.setCategory("Combo");
                                combo1.setImageUrl("");

                                MenuItem combo2 = new MenuItem();
                                combo2.setName("Tea-time Snack Pack");
                                combo2.setDescription("Ribbon Pakoda + 2 Kai Murukku + Kaara Boondhi (100g).");
                                combo2.setPrice(180.00);
                                combo2.setCategory("Combo");
                                combo2.setImageUrl("");

                                List<MenuItem> items = Arrays.asList(item1, item2, item3, item4, item5, combo1, combo2);
                                if (items != null) {
                                        repository.saveAll(items);
                                }
                        }
                };
        }
}
