# VLESS 订阅转换器

将裸 IP 列表（如 `104.168.176.241:24264#US`）转换为完整 VLESS 订阅链接。

## 部署

部署到 **Cloudflare Pages**：

```bash
wrangler pages deploy .
```

## 使用

```
https://你的域名/?url=https://zip.cm.edu.kg/all.txt
```

## 参数说明

| 参数 | 说明 |
|------|------|
| `url` | 订阅源地址（支持 all.txt 格式） |

## 输出格式

```
vless://UUID@IP:PORT/?type=ws&encryption=none&host=xxx&path=...#🇺🇸美国-vless-IP
```
