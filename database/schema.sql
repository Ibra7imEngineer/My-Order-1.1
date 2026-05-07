-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: 06 أبريل 2026 الساعة 03:17
-- إصدار الخادم: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `restaurant_orders`
--

-- --------------------------------------------------------

--
-- بنية الجدول `menu`
--

CREATE TABLE `menu` (
  `id` int(11) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL CHECK (`unit_price` >= 0),
  `category` varchar(100) NOT NULL,
  `image_url` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `menu`
--

INSERT INTO `menu` (`id`, `item_name`, `unit_price`, `category`, `image_url`, `created_at`, `updated_at`) VALUES
(12, 'برجر كنج كلاسيك', 120.00, 'أطعمة', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(13, 'بيتزا مارغريتا', 150.00, 'أطعمة', 'https://shamlola.s3.amazonaws.com/Shamlola_Images/4/src/b11f679586fbe4fb51d1b5625266798b1e1b5637.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(14, 'سباجيتي بولونيز', 110.00, 'أطعمة', 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(15, 'برجر دبل تشيز', 160.00, 'أطعمة', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(16, 'فاهيتا دجاج', 130.00, 'أطعمة', 'https://i.ytimg.com/vi/9rQ9sCsuhRE/maxresdefault.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(17, 'تشيكن سلايدر', 100.00, 'أطعمة', 'https://images.deliveryhero.io/image/talabat/MenuItems/mmw_638785302646390343', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(18, 'سلطة خضراء', 80.00, 'أطعمة', 'https://www.justfood.tv/big/0quick%20green%20salad.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(19, 'سوشي سيت', 250.00, 'أطعمة', 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(20, 'شاورما دجاج', 100.00, 'أطعمة', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(21, 'بطاطس ', 50.00, 'أطعمة', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsDvjHKJr-qPCjvGXYHS58a5JQeOo1nDTHtg&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(22, 'مشويات مشكلة (كباب وكفتة)', 500.00, 'أطعمة', 'https://www.mado.menu/wp-content/uploads/2022/07/Mado-12-1170x659.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(23, 'دجاج مقلي (بروستد)', 130.00, 'أطعمة', 'https://cdn.arabsstock.com/uploads/images/180294/a-collection-of-crispy-fried-thumbnail-180294.webp', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(24, 'ستيك لحم ريب آي', 400.00, 'أطعمة', 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(25, 'كلوب ساندوتش', 100.00, 'أطعمة', 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(26, 'تاكو مكسيكي', 120.00, 'أطعمة', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(27, 'سلطة سيزر دجاج', 100.00, 'أطعمة', 'https://liveegy.com/wp-content/uploads/2025/04/ddcaa8deb13ff8ccc22cc6475937480f.png.webp', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(28, 'هوت دوج سبيشال', 70.00, 'أطعمة', 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(29, 'جمبري مشوي', 300.00, 'أطعمة', 'https://static.aljamila.com/styles/640x426/public/shutterstock_1090496684.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(30, 'لازانيا باللحم', 150.00, 'أطعمة', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQpQBxjzTpQkxyb_sQgxZEUQ1slsQjx6cjbQQ&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(31, 'أجنحة دجاج حارة', 100.00, 'أطعمة', 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(32, 'عصير برتقال ', 30.00, 'مشروبات', 'https://static.sayidaty.net/styles/1375_scale/public/2018/05/16/3663196-1246521145.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(33, 'عصير مانجو', 50.00, 'مشروبات', 'https://cdn.altibbi.com/cdn/cache/1000x500/image/2023/06/21/ebf6d6b1e9ce5f41478a166a034e0ce9.jpg.webp', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(34, 'عصير تفاح فريش', 50.00, 'مشروبات', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgod5ahYgnGxjCQkZvC4NGvlJuZL97HaSYOA&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(35, 'عصير فراولة', 50.00, 'مشروبات', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSmKBzSmm_LMdbRrWDWEryOw4nEAdoAj_1KoQ&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(36, 'عصير ليمون نعناع', 30.00, 'مشروبات', 'https://kitchen.sayidaty.net/uploads/small/2d/2d3ca110e699ced93bfdd6f103ab930c_w750_h750.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(37, 'سموذي التوت', 60.00, 'مشروبات', 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(38, 'لاتيه سخن', 50.00, 'مشروبات', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRf4VLG6eTr0zmlVbS_YeEVYO_K5PI_mGof3g&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(39, 'لاتيه بارد', 50.00, 'مشروبات', 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(40, 'كابتشينو', 60.00, 'مشروبات', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWYs1dhIpYAyQP_49ctzWRLZqNQy2qlI8I1g&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(41, 'قهوة تركي', 30.00, 'مشروبات', 'https://i.ytimg.com/vi/vSMEpC8oPGs/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCblaw35C-BSXMB_uK2z6y2JmHIdg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(42, 'قهوة فرنساوى', 45.00, 'مشروبات', 'https://media.elbalad.news/2024/10/large/879/2/113.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(43, 'كعكة الشوكولاتة', 100.00, 'حلويات', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(44, 'كريب نوتيلا', 80.00, 'حلويات', 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(45, 'بسبوسة بالمكسرات', 110.00, 'حلويات', 'https://www.exception-group.com/wp-content/uploads/2024/08/1.webp', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(46, 'كنافه فستق', 100.00, 'حلويات', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT7JOAwo2iikYm2aG24pwyL1jneh2F5uTEroQ&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(47, 'تشيز كيك فراولة', 120.00, 'حلويات', 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(48, 'وافل نوتيلا', 70.00, 'حلويات', 'https://mybayutcdn.bayut.com/mybayut/wp-content/uploads/Best-places-for-waffles-in-Ajman-_-Body-2-14-9-23-ar-1024x640.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(49, 'وافل مكس', 100.00, 'حلويات', 'https://images.deliveryhero.io/image/talabat/MenuItems/mmw_638844405054029222', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(50, 'كرواسون فستق', 70.00, 'حلويات', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ2PcA5ErUky8NKfk2lc64eMOV1U6N4b-y9gA&s', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(51, 'كرواسون شوكولاتة', 50.00, 'حلويات', 'https://img.freepik.com/premium-photo/croissant-with-chocolate-sauce-drizzled-top_875133-8.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20'),
(52, 'موز باللبن', 40.00, 'مشروبات', 'https://kitchen.sayidaty.net/uploads/small/0b/0b726e45b05f19a98077eb27caf28554_w750_h500.jpg', '2026-04-06 00:23:20', '2026-04-06 00:23:20');

-- --------------------------------------------------------

--
-- بنية الجدول `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `order_status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `orders`
--

INSERT INTO `orders` (`order_id`, `customer_name`, `phone`, `address`, `total_price`, `order_status`, `created_at`) VALUES
(33, 'ibrahim el koridy', '201229965943', 'سدي سالم كفرالشيخ', 160.00, 'pending', '2026-04-06 01:09:19'),
(34, 'هيما محمد', '201229965943', 'سدي سالم القن 42d', 160.00, 'pending', '2026-04-06 01:15:09');

-- --------------------------------------------------------

--
-- بنية الجدول `order_items`
--

CREATE TABLE `order_items` (
  `item_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `menu_id` int(11) DEFAULT NULL,
  `item_name` varchar(255) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL CHECK (`quantity` > 0),
  `unit_price` decimal(10,2) NOT NULL CHECK (`unit_price` >= 0),
  `subtotal` decimal(10,2) NOT NULL CHECK (`subtotal` >= 0),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- إرجاع أو استيراد بيانات الجدول `order_items`
--

INSERT INTO `order_items` (`item_id`, `order_id`, `menu_id`, `item_name`, `category`, `quantity`, `unit_price`, `subtotal`, `created_at`) VALUES
(73, 33, 15, 'برجر دبل تشيز', '0', 1, 160.00, 160.00, '2026-04-06 01:09:19'),
(74, 34, 15, 'برجر دبل تشيز', '0', 1, 160.00, 160.00, '2026-04-06 01:15:09');

--
-- القوادح `order_items`
--
DELIMITER $$
CREATE TRIGGER `trg_order_items_before_insert` BEFORE INSERT ON `order_items` FOR EACH ROW BEGIN
    SET NEW.subtotal = NEW.quantity * NEW.unit_price;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_order_items_before_update` BEFORE UPDATE ON `order_items` FOR EACH ROW BEGIN
    SET NEW.subtotal = NEW.quantity * NEW.unit_price;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_order_total_after_insert` AFTER INSERT ON `order_items` FOR EACH ROW BEGIN
    UPDATE orders 
    SET total_price = (SELECT SUM(subtotal) FROM order_items WHERE order_id = NEW.order_id)
    WHERE order_id = NEW.order_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_order_total_on_delete` AFTER DELETE ON `order_items` FOR EACH ROW BEGIN
    UPDATE orders 
    SET total_amount = (SELECT COALESCE(SUM(subtotal), 0) FROM order_items WHERE order_id = OLD.order_id)
    WHERE order_id = OLD.order_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_order_total_on_update` AFTER UPDATE ON `order_items` FOR EACH ROW BEGIN
    UPDATE orders 
    SET total_price = (SELECT SUM(subtotal) FROM order_items WHERE order_id = NEW.order_id)
    WHERE order_id = NEW.order_id;
END
$$
DELIMITER ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `menu`
--
ALTER TABLE `menu`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_name` (`item_name`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_item_name` (`item_name`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `idx_order_id` (`order_id`),
  ADD KEY `idx_menu_id` (`menu_id`),
  ADD KEY `idx_category` (`category`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `menu`
--
ALTER TABLE `menu`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=75;

--
-- قيود الجداول المُلقاة.
--

--
-- قيود الجداول `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`menu_id`) REFERENCES `menu` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
