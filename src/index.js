export default {
  async fetch(request) {
    const url = new URL(request.url);
    const source = url.searchParams.get('url');
    const format = url.searchParams.get('format') || 'vless';
    if (!source) {
      return new Response('Missing url parameter', { status: 400 });
    }

    try {
      const res = await fetch(source);
      const text = await res.text();

      const countryNames = {
        US:'🇺🇸美国',NL:'🇳🇱荷兰',DE:'🇩🇪德国',JP:'🇯🇵日本',HK:'🇭🇰香港',
        GB:'🇬🇧英国',FR:'🇫🇷法国',FI:'🇫🇮芬兰',RU:'🇷🇺俄罗斯',TR:'🇹🇷土耳其',
        PL:'🇵🇱波兰',BG:'🇧🇬保加利亚',RO:'🇷🇴罗马尼亚',ES:'🇪🇸西班牙',CH:'🇨🇭瑞士',
        LV:'🇱🇻拉脱维亚',AT:'🇦🇹奥地利',BE:'🇧🇪比利时',IE:'🇮🇪爱尔兰',SE:'🇸🇪瑞典',
        KZ:'🇰🇿哈萨克斯坦',AL:'🇦🇱阿尔巴尼亚',MD:'🇲🇩摩尔多瓦',AU:'🇦🇺澳大利亚',
        CA:'🇨🇦加拿大',SG:'🇸🇬新加坡',MY:'🇲🇾马来西亚',IT:'🇮🇹意大利',NO:'🇳🇴挪威',
        DK:'🇩🇰丹麦',CZ:'🇨🇿捷克',PT:'🇵🇹葡萄牙',BR:'🇧🇷巴西',KR:'🇰🇷韩国',
        TW:'🇹🇼台湾',IN:'🇮🇳印度',TH:'🇹🇭泰国',ID:'🇮🇩印尼',VN:'🇻🇳越南',
        PH:'🇵🇭菲律宾',AR:'🇦🇷阿根廷',CL:'🇨🇱智利',MX:'🇲🇽墨西哥',UA:'🇺🇦乌克兰',
        GR:'🇬🇷希腊',HU:'🇭🇺匈牙利',SK:'🇸🇰斯洛伐克',RS:'🇷🇸塞尔维亚',HR:'🇭🇷克罗地亚',
        EE:'🇪🇪爱沙尼亚',LT:'🇱🇹立陶宛',SI:'🇸🇮斯洛文尼亚',NZ:'🇳🇿新西兰',ZA:'🇿🇦南非'
      };

      const nodes = text.split('\n')
        .map(l => l.trim())
        .filter(l => l && l.includes(':'))
        .map(l => {
          const parts = l.split('#');
          const ipPort = parts[0].split(':');
          const tag = parts[1] || '';
          const ip = ipPort[0];
          const port = ipPort[1];
          const cc = (tag.toUpperCase().split('-')[0] || tag.toUpperCase().slice(0,2));
          const name = `${countryNames[cc] || cc}-vless-${ip}`;
          return { ip, port, name, cc };
        });

      if (format === 'clash') {
        const proxies = nodes.map(n => ({
          name: n.name,
          type: 'vless',
          server: n.ip,
          port: parseInt(n.port),
          uuid: url.searchParams.get('uuid') || 'YOUR_UUID',
          network: 'ws',
          'ws-opts': { path: `/proxyip=${n.ip}:${n.port}` },
          tls: true,
          sni: url.searchParams.get('sni') || 'YOUR_SNI',
          'client-fingerprint': 'chrome',
          alpn: ['http/1.1']
        }));

        const proxyNames = proxies.map(p => p.name);
        const yaml = `port: 7890
mixed-port: 7891
allow-lan: true
mode: rule
log-level: info
external-controller: 0.0.0.0:9090

dns:
  enable: true
  listen: 0.0.0.0:1053
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - https://dns.alidns.com/dns-query
    - https://doh.pub/dns-query

proxies:
${proxies.map(p => `  - name: ${p.name}
    type: vless
    server: ${p.server}
    port: ${p.port}
    uuid: ${p.uuid}
    network: ws
    ws-opts:
      path: "${p['ws-opts'].path}"
      headers:
        Host: ${p.sni}
    tls: true
    servername: ${p.sni}
    sni: ${p.sni}
    client-fingerprint: chrome
    alpn:
      - http/1.1`).join('\n')}

proxy-groups:
  - name: 🚀 节点选择
    type: select
    proxies:
      - ♻️ 自动选择
      - 🔯 故障转移
      - 👋 手动切换
      - DIRECT
${[...new Set(nodes.map(n => n.cc))].map(cc => `      - ${countryNames[cc] || cc} 节点`).join('\n')}

  - name: ♻️ 自动选择
    type: url-test
    proxies:
${proxyNames.map(n => `      - ${n}`).join('\n')}
    url: http://www.gstatic.com/generate_204
    interval: 300

  - name: 🔯 故障转移
    type: fallback
    proxies:
${proxyNames.map(n => `      - ${n}`).join('\n')}
    url: http://www.gstatic.com/generate_204
    interval: 300

  - name: 👋 手动切换
    type: select
    proxies:
${proxyNames.map(n => `      - ${n}`).join('\n')}

rules:
  - GEOIP,CN,DIRECT
  - MATCH,🚀 节点选择`;
        return new Response(yaml, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
      }

      const sni = url.searchParams.get('sni') || 'YOUR_SNI';
      const base = `vless://${url.searchParams.get('uuid') || 'YOUR_UUID'}@{IP}:{PORT}/?type=ws&encryption=none&flow=&host=${sni}&path=%2Fproxyip%3D{IP}%3A{PORT}&security=tls&sni=${sni}&fp=chrome&packetEncoding=xudp`;
      const vless = nodes.map(n => {
        const node = base.replace('{IP}', n.ip).replace('{PORT}', n.port);
        return `${node}#${encodeURIComponent(n.name)}`;
      }).join('\n');

      return new Response(vless, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
    } catch (e) {
      return new Response('Error: ' + e.message, { status: 500 });
    }
  }
};
