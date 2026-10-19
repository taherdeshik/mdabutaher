-- mdabutaher.com — cPanel / phpMyAdmin এ এই SQL চালান
-- (অ্যাপ প্রথম চালু হলেও টেবিলটি নিজে থেকেই তৈরি করে; ম্যানুয়ালি করতে চাইলে এটি ব্যবহার করুন)

CREATE TABLE IF NOT EXISTS `civic_store` (
  `id` TINYINT UNSIGNED NOT NULL,
  `doc` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `civic_store` (`id`, `doc`) VALUES (1, '{}');
