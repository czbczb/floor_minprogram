
// 获取一级分类和banner列表
curl 'https://dev.sodatool.com/api/huadi/home' \
-H 'Host: dev.sodatool.com' \
-H 'Connection: keep-alive' \
-H 'apiVersion: 1.1' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641739) XWEB/18926' \
-H 'xweb_xhr: 1' \
-H 'Accept: */*' \
-H 'Sec-Fetch-Site: cross-site' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Referer: https://servicewechat.com/wx0b5ef45ca92cfc87/4/page-frame.html' \
-H 'Accept-Language: zh-CN,zh;q=0.9' \
-H 'Content-Type: application/json' \
--proxy http://localhost:9090


// 根据一级分类id获取二级分类
curl 'https://dev.sodatool.com/api/huadi/getCollect' \
-X POST \
-H 'Host: dev.sodatool.com' \
-H 'Connection: keep-alive' \
-H 'apiVersion: 1.1' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641739) XWEB/18926' \
-H 'xweb_xhr: 1' \
-H 'Accept: */*' \
-H 'Sec-Fetch-Site: cross-site' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Referer: https://servicewechat.com/wx0b5ef45ca92cfc87/4/page-frame.html' \
-H 'Accept-Language: zh-CN,zh;q=0.9' \
-H 'Content-Type: application/json' \
--data-raw '{"id":"9"}' \
--proxy http://localhost:9090

// 根据二级分类id获取商品列表
curl 'https://dev.sodatool.com/api/huadi/getCategory' \
-X POST \
-H 'Host: dev.sodatool.com' \
-H 'Connection: keep-alive' \
-H 'apiVersion: 1.1' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641739) XWEB/18926' \
-H 'xweb_xhr: 1' \
-H 'Accept: */*' \
-H 'Sec-Fetch-Site: cross-site' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Referer: https://servicewechat.com/wx0b5ef45ca92cfc87/4/page-frame.html' \
-H 'Accept-Language: zh-CN,zh;q=0.9' \
-H 'Content-Type: application/json' \
--data-raw '{"id":"196"}' \
--proxy http://localhost:9090

// 获取商品详情接口
curl 'https://dev.sodatool.com/api/huadi/getItem' \
-X POST \
-H 'Host: dev.sodatool.com' \
-H 'Connection: keep-alive' \
-H 'apiVersion: 1.2' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641739) XWEB/18926' \
-H 'xweb_xhr: 1' \
-H 'Accept: */*' \
-H 'Sec-Fetch-Site: cross-site' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Referer: https://servicewechat.com/wx0b5ef45ca92cfc87/4/page-frame.html' \
-H 'Accept-Language: zh-CN,zh;q=0.9' \
-H 'Content-Type: application/x-www-form-urlencoded' \
--data-raw 'id=2389' \
--proxy http://localhost:9090


// 获取所有二级分类和对应的商品列表
curl 'https://dev.sodatool.com/api/huadi/getList' \
-H 'Host: dev.sodatool.com' \
-H 'Connection: keep-alive' \
-H 'apiVersion: 1.1' \
-H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.7(0x13080712) UnifiedPCMacWechat(0xf2641739) XWEB/18926' \
-H 'xweb_xhr: 1' \
-H 'Accept: */*' \
-H 'Sec-Fetch-Site: cross-site' \
-H 'Sec-Fetch-Mode: cors' \
-H 'Sec-Fetch-Dest: empty' \
-H 'Referer: https://servicewechat.com/wx0b5ef45ca92cfc87/4/page-frame.html' \
-H 'Accept-Language: zh-CN,zh;q=0.9' \
-H 'Content-Type: application/json' \
--proxy http://localhost:9090