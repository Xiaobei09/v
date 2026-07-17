export default {
  async fetch(request) {
    const url = new URL(request.url);
    const source = url.searchParams.get('url');
    const uuid = url.searchParams.get('uuid');
    const sni = url.searchParams.get('sni');

    if (!source) {
      return new Response('Missing url parameter', { status: 400 });
    }

    try {
      const res = await fetch(source);
      const text = await res.text();

      const countryNames = {
        'US': '🇺🇸美国', 'NL': '🇳🇱荷兰', 'DE': '🇩🇪德国', 'JP': '🇯🇵日本',
        'HK': '🇭🇰香港', 'GB': '🇬🇧英国', 'FR': '🇫🇷法国', 'FI': '🇫🇮芬兰',
        'RU': '🇷🇺俄罗斯', 'TR': '🇹🇷土耳其', 'PL': '🇵🇱波兰', 'BG': '🇧🇬保加利亚',
        'RO': '🇷🇴罗马尼亚', 'ES': '🇪🇸西班牙', 'CH': '🇨🇭瑞士', 'LV': '🇱🇻拉脱维亚',
        'AT': '🇦🇹奥地利', 'BE': '🇧🇪比利时', 'IE': '🇮🇪爱尔兰', 'SE': '🇸🇪瑞典',
        'KZ': '🇰🇿哈萨克斯坦', 'AL': '🇦🇱阿尔巴尼亚', 'MD': '🇲🇩摩尔多瓦',
        'AU': '🇦🇺澳大利亚', 'CA': '🇨🇦加拿大', 'SG': '🇸🇬新加坡', 'MY': '🇲🇾马来西亚',
        'IT': '🇮🇹意大利', 'NO': '🇳🇴挪威', 'DK': '🇩🇰丹麦', 'CZ': '🇨🇿捷克',
        'PT': '🇵🇹葡萄牙', 'BR': '🇧🇷巴西', 'KR': '🇰🇷韩国', 'TW': '🇹🇼台湾',
        'IN': '🇮🇳印度', 'TH': '🇹🇭泰国', 'ID': '🇮🇩印尼', 'VN': '🇻🇳越南',
        'PH': '🇵🇭菲律宾', 'AR': '🇦🇷阿根廷', 'CL': '🇨🇱智利', 'MX': '🇲🇽墨西哥',
        'UA': '🇺🇦乌克兰', 'GR': '🇬🇷希腊', 'HU': '🇭🇺匈牙利', 'SK': '🇸🇰斯洛伐克',
        'RS': '🇷🇸塞尔维亚', 'HR': '🇭🇷克罗地亚', 'EE': '🇪🇪爱沙尼亚',
        'LT': '🇱🇹立陶宛', 'SI': '🇸🇮斯洛文尼亚', 'NZ': '🇳🇿新西兰', 'ZA': '🇿🇦南非'
      };

      // 使用参数或默认值（避免硬编码）
      const nodeUuid = uuid || 'YOUR_UUID_HERE';
      const nodeSni = sni || 'YOUR_SNI_HERE';

      const baseConfig = `vless://${nodeUuid}@{IP}:{PORT}/?type=ws&encryption=none&flow=&host=${nodeSni}&path=%2Fproxyip%3D{IP}%3A{PORT}&security=tls&sni=${nodeSni}&fp=chrome&packetEncoding=xudp`;

      const nodes = text.split('\n')
        .map(line => line.trim())
        .filter(line => line && line.includes(':'))
        .map(line => {
          const parts = line.split('#');
          const ipPort = parts[0].split(':');
          const tag = parts[1] || '';

          const ip = ipPort[0];
          const port = ipPort[1];
          const countryCode = tag.toUpperCase().split('-')[0] || tag.toUpperCase().slice(0, 2);
          const countryName = countryNames[countryCode] || tag || countryCode;

          const node = baseConfig
            .replace('{IP}', ip)
            .replace('{PORT}', port);

          const name = `${countryName}-vless-${ip}`;
          return `${node}#${encodeURIComponent(name)}`;
        });

      return new Response(nodes.join('\n'), {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      return new Response('Error: ' + err.message, { status: 500 });
    }
  }
};
