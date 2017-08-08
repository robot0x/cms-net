DROP TABLE IF EXISTS `cms_adv`;
CREATE TABLE `cms_adv` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
  `type` varchar(12) DEFAULT '' COMMENT '类型，取值范围为link、ec',
  `can_leave` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '是否能跳转到第三方app，1能跳，0不能跳',
  `value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '文章url或商品id。type == link，为链接；type == ec，为商品id',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '图片url',
  `aid` int(11) unsigned DEFAULT NULL COMMENT '文章短id',
  `start` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '广告开始时间',
  `end` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '广告结束时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='有调广告表';