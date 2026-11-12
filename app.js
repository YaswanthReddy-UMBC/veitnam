/* Vietnam AR — animated effects for each card.
   Card space: width 1 (x: -0.5..0.5), height H (y: -H/2..H/2), +z comes out toward the viewer. */
(function () {
  const THREE = AFRAME.THREE;
  const CARD_H = 1.4; // card images are 1500x2100
  const FONT = '"Be Vietnam Pro", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

  // sprite pixel sizes (width, height) — used for aspect ratios
  const SPR = {
    lantern: [200, 320], lotus: [260, 210], star: [220, 220], sparkle: [120, 120], hat: [260, 150], boat: [260, 220],
    bowl: [260, 230], steam: [120, 220], cloud: [260, 140], bird: [120, 60], petal: [80, 120], leaf: [80, 200],
    flag: [600, 400], coffee: [200, 240], drum: [240, 240], buffalo: [300, 200], fan: [300, 240], bridge: [400, 300],
    water: [128, 512], rainbow: [300, 160], ray: [160, 400], springrolls: [300, 190], noodles: [300, 200],
    personA: [80, 140], personB: [80, 140], personC: [80, 140], personD: [80, 140], pin: [80, 110], rice: [140, 120],
    map: [400, 839.3], mapglow: [440, 879.3],
  };
  const CITIES = { 'Hà Nội': [203.4, 131.6], 'Đà Nẵng': [333, 414.7], 'TP. Hồ Chí Minh': [247.7, 714.4] };

  // ---------- helpers ----------
  const loader = new THREE.TextureLoader();
  const texCache = {};
  function tex(name) {
    if (!texCache[name]) {
      const t = loader.load(name + '.png');
      t.colorSpace = THREE.SRGBColorSpace;
      texCache[name] = t;
    }
    return texCache[name];
  }
  function plane(texture, w, h, opts = {}) {
    const g = new THREE.PlaneGeometry(w, h, opts.segX || 1, 1);
    const m = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide, opacity: 1 });
    if (opts.additive) m.blending = THREE.AdditiveBlending;
    const mesh = new THREE.Mesh(g, m);
    return mesh;
  }
  function sprite(name, w, opts = {}) {
    const [pw, ph] = SPR[name];
    const mesh = plane(tex(name), w, w * ph / pw, opts);
    if (opts.anchorBottom) mesh.geometry.translate(0, (w * ph / pw) / 2, 0);
    return mesh;
  }
  function canvasTex(cw, ch, draw) {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const ctx = c.getContext('2d'); draw(ctx, cw, ch);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.userData = { canvas: c, ctx };
    return t;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  // a pill label (used for facts and city names)
  function label(text, w, opts = {}) {
    const fs = opts.size || 60, padX = 44;
    const meas = document.createElement('canvas').getContext('2d');
    meas.font = `700 ${fs}px ${FONT}`;
    const tw = Math.ceil(meas.measureText(text).width) + padX * 2, th = Math.round(fs * 1.7);
    const t = canvasTex(tw, th, (ctx) => {
      roundRect(ctx, 4, 4, tw - 8, th - 8, (th - 8) / 2);
      ctx.fillStyle = opts.bg || 'rgba(255,255,255,0.94)'; ctx.fill();
      ctx.lineWidth = 6; ctx.strokeStyle = opts.border || '#d4a017'; ctx.stroke();
      ctx.font = `700 ${fs}px ${FONT}`; ctx.fillStyle = opts.color || '#8e0d14';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, tw / 2, th / 2 + 3);
    });
    return plane(t, w, w * th / tw);
  }
  function bannerMesh(title, sub) {
    const cw = 1200, ch = 340;
    const t = canvasTex(cw, ch, (ctx) => {
      // ribbon tails
      ctx.fillStyle = '#8e0d14';
      ctx.beginPath(); ctx.moveTo(10, 120); ctx.lineTo(150, 120); ctx.lineTo(150, 300); ctx.lineTo(10, 300); ctx.lineTo(70, 210); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cw - 10, 120); ctx.lineTo(cw - 150, 120); ctx.lineTo(cw - 150, 300); ctx.lineTo(cw - 10, 300); ctx.lineTo(cw - 70, 210); ctx.closePath(); ctx.fill();
      const g = ctx.createLinearGradient(0, 40, 0, 280); g.addColorStop(0, '#e8323a'); g.addColorStop(1, '#a50f18');
      roundRect(ctx, 90, 40, cw - 180, 240, 36); ctx.fillStyle = g; ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = '#ffcc33'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      let fs = 104; ctx.font = `800 ${fs}px ${FONT}`;
      while (ctx.measureText(title).width > cw - 260 && fs > 50) { fs -= 4; ctx.font = `800 ${fs}px ${FONT}`; }
      ctx.fillStyle = '#ffd84d'; ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
      ctx.fillText(title, cw / 2, sub ? 128 : 160);
      if (sub) { ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.font = `600 54px ${FONT}`; ctx.fillStyle = '#fff6e0'; ctx.fillText(sub, cw / 2, 222); }
    });
    return plane(t, 1.1, 1.1 * ch / cw);
  }
  function frameMesh(H) {
    const cw = 600, ch = Math.round(600 * H), pad = 40;
    const t = canvasTex(cw + pad * 2, ch + pad * 2, (ctx) => {
      ctx.shadowColor = '#ffd54f'; ctx.shadowBlur = 30; ctx.lineWidth = 14; ctx.strokeStyle = '#ffe082';
      roundRect(ctx, pad, pad, cw, ch, 24); ctx.stroke(); ctx.stroke();
    });
    const m = plane(t, 1 * (cw + pad * 2) / cw, H * (ch + pad * 2) / ch, { additive: true });
    return m;
  }

  // easing
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const easeOutBack = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const easeOutElastic = (x) => { x = clamp(x); if (x === 0 || x === 1) return x; return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1; };
  const easeOutCubic = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const setOpacity = (m, o) => { m.material.opacity = clamp(o); };
  const popScale = (m, s) => m.scale.setScalar(Math.max(0.0001, s));

  // ---------- reusable effects ----------
  // Each effect: (group, card) => update(t, age)   t = seconds since page start, age = seconds since card was found
  const FX = {};

  FX.frame = (g, card) => {
    const m = frameMesh(card.h); m.position.z = 0.002; g.add(m);
    return (t, age) => { setOpacity(m, (0.55 + 0.45 * Math.sin(t * 4)) * clamp(age * 3)); };
  };
  FX.banner = (g, card) => {
    const m = bannerMesh(card.title, card.sub); g.add(m);
    const y0 = card.h / 2 + 0.16;
    return (t, age) => {
      const k = easeOutBack(age / 0.8);
      m.position.set(0, y0 + (1 - k) * 0.35 + Math.sin(t * 2) * 0.012, 0.12);
      popScale(m, 0.3 + 0.7 * k); setOpacity(m, clamp(age * 3));
    };
  };
  FX.fact = (g, card) => {
    if (!card.fact) return () => {};
    const m = label(card.fact, Math.min(1.05, 0.024 * card.fact.length + 0.14), { size: 56 }); g.add(m);
    return (t, age) => {
      const k = easeOutBack((age - 1.6) / 0.6);
      m.position.set(0, -card.h / 2 - 0.1 + Math.sin(t * 2.4) * 0.008, 0.1);
      popScale(m, k); setOpacity(m, clamp((age - 1.6) * 3));
    };
  };
  FX.burst = (g) => {
    const parts = [];
    for (let i = 0; i < 16; i++) {
      const m = sprite(i % 3 ? 'sparkle' : 'star', rnd(0.07, 0.14)); g.add(m);
      const a = (i / 16) * Math.PI * 2 + rnd(-0.2, 0.2);
      parts.push({ m, a, d: rnd(0.5, 0.85), spin: rnd(-4, 4) });
    }
    return (t, age) => {
      const k = easeOutCubic(age / 1.3);
      for (const p of parts) {
        p.m.position.set(Math.cos(p.a) * p.d * k, Math.sin(p.a) * p.d * k * 1.15, 0.05 + 0.35 * k);
        p.m.rotation.z = p.spin * age; popScale(p.m, 0.4 + k);
        setOpacity(p.m, age < 0.05 ? 0 : 1 - clamp((age - 0.7) / 0.6));
      }
    };
  };
  FX.twinkle = (g, card, n = 10) => {
    const parts = [];
    for (let i = 0; i < n; i++) {
      const m = sprite('sparkle', rnd(0.05, 0.1)); g.add(m);
      m.position.set(rnd(-0.6, 0.6), rnd(-card.h / 2 - 0.1, card.h / 2 + 0.1), rnd(0.05, 0.3));
      parts.push({ m, ph: rnd(0, 6.28), sp: rnd(2, 5) });
    }
    return (t, age) => {
      for (const p of parts) { const s = 0.5 + 0.5 * Math.sin(t * p.sp + p.ph); popScale(p.m, 0.3 + s); setOpacity(p.m, s * clamp(age - 0.5)); }
    };
  };
  FX.lanterns = (g, card, n = 8) => {
    const L = [];
    for (let i = 0; i < n; i++) {
      const m = sprite('lantern', rnd(0.13, 0.2)); g.add(m);
      L.push({ m, x: -0.55 + 1.1 * (i + 0.5) / n + rnd(-0.05, 0.05), z: rnd(0.08, 0.45), per: rnd(6, 9), off: rnd(0, 1), ph: rnd(0, 6) });
    }
    return (t, age) => {
      for (const l of L) {
        const u = ((age / l.per) + l.off) % 1;
        l.m.position.set(l.x + Math.sin(t * 1.3 + l.ph) * 0.04, -card.h / 2 - 0.1 + u * (card.h + 0.6), l.z);
        l.m.rotation.z = Math.sin(t * 1.7 + l.ph) * 0.12;
        setOpacity(l.m, Math.min(clamp(u * 6), clamp((1 - u) * 5)) * clamp(age * 2));
      }
    };
  };
  FX.flag = (g) => {
    const w = 0.8, h = w * 400 / 600;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.72, 8), new THREE.MeshBasicMaterial({ color: 0xc9a227 }));
    const m = plane(tex('flag'), w, h, { segX: 30 });
    const pos = m.geometry.attributes.position; const base = Float32Array.from(pos.array);
    const holder = new THREE.Group(); holder.add(pole); holder.add(m); g.add(holder);
    pole.position.set(-w / 2, -0.01, 0); m.position.set(0, 0.3 - h / 2 + 0.05, 0);
    const knob = sprite('star', 0.08); knob.position.set(-w / 2, 0.32, 0.01); holder.add(knob);
    return (t, age) => {
      const k = easeOutBack(age / 0.9);
      holder.position.set(0.04, -0.05 - (1 - k) * 0.5, 0.25); holder.scale.setScalar(Math.max(0.001, k));
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3], y = base[i * 3 + 1]; const f = (x + w / 2) / w;
        pos.array[i * 3 + 2] = Math.sin(x * 9 - t * 6) * 0.05 * f;
        pos.array[i * 3 + 1] = y + Math.sin(x * 7 - t * 5) * 0.015 * f;
      }
      pos.needsUpdate = true;
    };
  };
  FX.orbitStars = (g, card, n = 5) => {
    const S = []; for (let i = 0; i < n; i++) { const m = sprite('star', 0.11); g.add(m); S.push(m); }
    return (t, age) => {
      S.forEach((m, i) => {
        const a = t * 0.9 + i * Math.PI * 2 / n;
        m.position.set(Math.cos(a) * 0.55, 0.05 + Math.sin(a) * 0.5, 0.3 + Math.sin(a) * 0.1);
        m.rotation.z = t * 2; popScale(m, easeOutBack((age - 0.6 - i * 0.1) / 0.5));
      });
    };
  };
  FX.map = (g) => {
    const h = 1.15, w = h * 400 / 839.3;
    const holder = new THREE.Group(); g.add(holder);
    const glow = sprite('mapglow', w * 440 / 400, { additive: true }); holder.add(glow);
    const m = sprite('map', w); m.position.z = 0.01; holder.add(m);
    const pins = Object.entries(CITIES).map(([name, [px, py]], i) => {
      const x = (px / 400 - 0.5) * w, y = (0.5 - py / 839.3) * h;
      const pin = sprite('pin', 0.09, { anchorBottom: true }); pin.position.set(x, y, 0.03); holder.add(pin);
      const lw = Math.min(0.42, 0.05 * name.length / 1.6 + 0.08);
      const lb = label(name, lw, { size: 64 });
      const left = name.length > 8; // long names go on the left side of the pin
      lb.position.set(left ? x - lw / 2 - 0.04 : x + lw / 2 + 0.04, y + 0.05, 0.04); holder.add(lb);
      return { pin, lb, y, i };
    });
    return (t, age) => {
      const k = easeOutBack(age / 0.9);
      holder.position.set(0, -0.02, 0.12 + 0.08 * k); holder.scale.setScalar(Math.max(0.001, 0.4 + 0.6 * k));
      holder.rotation.y = Math.sin(t * 0.8) * 0.12;
      setOpacity(glow, 0.5 + 0.5 * Math.sin(t * 3)); setOpacity(m, clamp(age * 3));
      for (const p of pins) {
        const a = age - 1 - p.i * 0.45; const d = easeOutBounce(a / 0.7);
        p.pin.position.y = p.y + (1 - d) * 0.5; setOpacity(p.pin, clamp(a * 4));
        popScale(p.lb, easeOutBack((a - 0.5) / 0.4));
      }
    };
  };
  function easeOutBounce(x) {
    x = clamp(x); const n1 = 7.5625, d1 = 2.75;
    if (x < 1 / d1) return n1 * x * x; if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
    if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375; return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
  FX.population = (g) => {
    const cw = 1000, ch = 300;
    const t = canvasTex(cw, ch, () => {});
    const counter = plane(t, 0.95, 0.95 * ch / cw); counter.position.set(0, 0.22, 0.25); g.add(counter);
    let last = -1;
    const draw = (val, done) => {
      const ctx = t.userData.ctx; ctx.clearRect(0, 0, cw, ch);
      roundRect(ctx, 10, 10, cw - 20, ch - 20, 40); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
      ctx.lineWidth = 10; ctx.strokeStyle = '#c8102e'; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `800 ${done ? 118 : 120}px ${FONT}`; ctx.fillStyle = '#c8102e';
      ctx.fillText(done ? '100 million+' : Math.floor(val).toLocaleString('en-US'), cw / 2, 128);
      ctx.font = `600 52px ${FONT}`; ctx.fillStyle = '#5d4037'; ctx.fillText('people live in Vietnam', cw / 2, 232);
      t.needsUpdate = true;
    };
    const kinds = ['personA', 'personB', 'personC', 'personD'];
    const people = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 7; i++) {
      const m = sprite(kinds[(i + r) % 4], 0.11, { anchorBottom: true }); g.add(m);
      m.position.set(-0.42 + i * 0.14 + r * 0.07, -0.55 + r * 0.24, 0.1 + (1 - r) * 0.1);
      people.push({ m, d: (r * 7 + i) * 0.12 });
    }
    return (tt, age) => {
      const k = clamp(age / 2.6); const val = 100000000 * (1 - Math.pow(1 - k, 3)); const done = k >= 1;
      const key = done ? -2 : Math.floor(val / 997);
      if (key !== last) { draw(val, done); last = key; }
      popScale(counter, easeOutBack(age / 0.6));
      for (const p of people) { popScale(p.m, easeOutElastic((age - 0.4 - p.d) / 0.9)); p.m.position.z += 0; p.m.rotation.z = Math.sin(tt * 4 + p.d * 9) * 0.06; }
    };
  };
  FX.drum = (g) => {
    const drum = sprite('drum', 0.75); drum.position.set(0, 0, 0.15); g.add(drum);
    const rings = []; for (let i = 0; i < 3; i++) { const r = sprite('sparkle', 0.3, { additive: true }); r.position.z = 0.14; g.add(r); rings.push(r); }
    return (t, age) => {
      const k = easeOutBack(age / 0.9);
      popScale(drum, k); drum.rotation.z = t * 0.6; drum.position.z = 0.15 + Math.sin(t * 2) * 0.02;
      rings.forEach((r, i) => { const u = ((t * 0.5) + i / 3) % 1; popScale(r, 1 + u * 4); setOpacity(r, (1 - u) * 0.6 * clamp(age - 0.5)); r.rotation.z = t; });
    };
  };
  FX.buffalo = (g) => {
    const rice = []; for (let i = 0; i < 7; i++) { const m = sprite('rice', rnd(0.14, 0.2), { anchorBottom: true }); m.position.set(-0.5 + i * 0.17, -0.62 + rnd(-0.03, 0.03), 0.05 + rnd(0, 0.25)); g.add(m); rice.push({ m, d: i * 0.08, ph: rnd(0, 6) }); }
    const b = sprite('buffalo', 0.62, { anchorBottom: true }); g.add(b);
    const birds = []; for (let i = 0; i < 3; i++) { const m = sprite('bird', 0.09); g.add(m); birds.push({ m, off: i * 0.3, y: 0.3 + i * 0.12 }); }
    return (t, age) => {
      rice.forEach(r => { popScale(r.m, easeOutElastic((age - r.d) / 0.9)); r.m.rotation.z = Math.sin(t * 2 + r.ph) * 0.06; });
      const u = (age * 0.09 + 0.35) % 1; // walks across, loops
      b.position.set(-0.85 + u * 1.7, -0.42 + Math.abs(Math.sin(t * 5)) * 0.02, 0.2);
      b.rotation.z = Math.sin(t * 5) * 0.03; setOpacity(b, Math.min(clamp(u * 8), clamp((1 - u) * 8)));
      birds.forEach(bd => { const v = ((t * 0.12) + bd.off) % 1; bd.m.position.set(0.8 - v * 1.6, bd.y + Math.sin(t * 2 + bd.off * 5) * 0.03, 0.35); bd.m.scale.set(1, 0.6 + 0.4 * Math.abs(Math.sin(t * 8 + bd.off * 3)), 1); setOpacity(bd.m, Math.min(clamp(v * 6), clamp((1 - v) * 6))); });
    };
  };
  FX.lotus = (g, card) => {
    const flowers = [[0, -0.18, 0.62, 0.25, 0], [-0.33, -0.48, 0.38, 0.15, 0.35], [0.33, -0.46, 0.4, 0.18, 0.6]].map(([x, y, w, z, d]) => {
      const m = sprite('lotus', w, { anchorBottom: true }); m.position.set(x, y, z); g.add(m); return { m, d, y };
    });
    const P = []; for (let i = 0; i < 10; i++) { const m = sprite('petal', rnd(0.05, 0.08)); g.add(m); P.push({ m, x: rnd(-0.55, 0.55), per: rnd(5, 8), off: rnd(0, 1), ph: rnd(0, 6), z: rnd(0.1, 0.5) }); }
    return (t, age) => {
      flowers.forEach(f => { popScale(f.m, easeOutElastic((age - f.d) / 1.2)); f.m.position.y = f.y + Math.sin(t * 1.5 + f.d * 5) * 0.012; });
      P.forEach(p => { const u = ((age / p.per) + p.off) % 1; p.m.position.set(p.x + Math.sin(t + p.ph) * 0.08, card.h / 2 + 0.2 - u * (card.h + 0.3), p.z); p.m.rotation.z = t * 1.5 + p.ph; setOpacity(p.m, Math.min(clamp(u * 6), clamp((1 - u) * 6)) * clamp(age - 0.8)); });
    };
  };
  FX.dance = (g) => {
    const fans = [[-0.27, 0.05, 1], [0.27, 0.05, -1]].map(([x, y, s], i) => {
      const pivot = new THREE.Group(); pivot.position.set(x, y, 0.22); g.add(pivot);
      const m = sprite('fan', 0.5); m.geometry.translate(0, 0.5 * 240 / 300 / 2 - 0.5 * (158 / 240) * (240 / 300), 0); // pivot near fan handle
      pivot.add(m); return { pivot, m, s, d: i * 0.25 };
    });
    const hats = []; for (let i = 0; i < 3; i++) { const m = sprite('hat', 0.3); g.add(m); hats.push({ m, i }); }
    return (t, age) => {
      fans.forEach(f => {
        const k = easeOutBack((age - f.d) / 0.8);
        f.m.scale.set(Math.max(0.001, k), Math.max(0.001, 0.3 + 0.7 * k), 1);
        f.pivot.rotation.z = f.s * (0.25 + Math.sin(t * 2.5 + f.d * 4) * 0.35);
      });
      hats.forEach(h => {
        const a = age * 1.1 + h.i * Math.PI * 2 / 3;
        h.m.position.set(Math.cos(a) * 0.38, -0.42 + Math.sin(a * 2) * 0.05, 0.3 + Math.sin(a) * 0.12);
        h.m.rotation.z = Math.sin(t * 3 + h.i) * 0.3; popScale(h.m, easeOutBack((age - 0.6 - h.i * 0.2) / 0.6));
      });
    };
  };
  FX.bridge = (g) => {
    const back = []; const front = [];
    for (let i = 0; i < 3; i++) { const c = sprite('cloud', rnd(0.3, 0.45)); c.position.z = 0.05; g.add(c); back.push({ c, off: i / 3, y: rnd(-0.1, 0.45) }); }
    const b = sprite('bridge', 0.95); g.add(b);
    for (let i = 0; i < 2; i++) { const c = sprite('cloud', rnd(0.35, 0.5)); g.add(c); front.push({ c, off: i / 2 + 0.2, y: rnd(-0.5, -0.3) }); }
    return (t, age) => {
      const k = easeOutCubic(age / 1.6);
      b.position.set(0, -0.75 + k * 0.75, 0.2); setOpacity(b, clamp(age * 2));
      b.rotation.z = Math.sin(t * 0.8) * 0.015;
      back.forEach(o => { const u = (t * 0.03 + o.off) % 1; o.c.position.x = -0.8 + u * 1.6; o.c.position.y = o.y; setOpacity(o.c, 0.85 * Math.min(clamp(u * 5), clamp((1 - u) * 5))); });
      front.forEach(o => { const u = (t * 0.045 + o.off) % 1; o.c.position.set(0.8 - u * 1.6, o.y, 0.45); setOpacity(o.c, 0.9 * Math.min(clamp(u * 5), clamp((1 - u) * 5)) * clamp(age - 1)); });
    };
  };
  FX.nature = (g) => {
    const rays = []; for (let i = 0; i < 3; i++) { const r = sprite('ray', 0.28, { additive: true }); r.position.set(-0.35 + i * 0.12, 0.25, 0.08); r.rotation.z = -0.25 + i * 0.05; g.add(r); rays.push({ r, ph: i * 2 }); }
    const wt = loader.load('water.png'); wt.colorSpace = THREE.SRGBColorSpace; wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(2, 1.2);
    const fall = plane(wt, 0.42, 1.0); fall.position.set(0.18, -0.05, 0.2); g.add(fall);
    const lip = sprite('cloud', 0.5); lip.position.set(0.18, 0.47, 0.22); setOpacity(lip, 0.6); g.add(lip);
    const mist = []; for (let i = 0; i < 4; i++) { const m = sprite('cloud', rnd(0.35, 0.5)); m.position.set(0.18 + rnd(-0.25, 0.25), -0.55 + rnd(-0.04, 0.04), 0.25 + i * 0.03); g.add(m); mist.push({ m, ph: rnd(0, 6) }); }
    const rb = sprite('rainbow', 0.8); rb.position.set(0.1, -0.25, 0.15); g.add(rb);
    const flies = []; for (let i = 0; i < 6; i++) { const m = sprite('sparkle', 0.05, { additive: true }); g.add(m); flies.push({ m, ph: rnd(0, 6), x: rnd(-0.5, -0.1), y: rnd(-0.4, 0.3) }); }
    return (t, age) => {
      const k = easeOutCubic(age / 1.0);
      fall.scale.set(1, Math.max(0.001, k), 1); fall.position.y = 0.45 - 0.5 * k; wt.offset.y = t * 1.4;
      setOpacity(fall, 0.9 * clamp(age * 2)); setOpacity(lip, 0.65 * clamp(age * 2));
      mist.forEach(m => { popScale(m.m, (0.8 + 0.2 * Math.sin(t * 2 + m.ph)) * clamp(age - 0.6)); setOpacity(m.m, 0.75); });
      setOpacity(rb, clamp((age - 1.5) / 1.5) * (0.75 + 0.25 * Math.sin(t)));
      rays.forEach(r => setOpacity(r.r, (0.35 + 0.3 * Math.sin(t * 1.5 + r.ph)) * clamp(age - 0.3)));
      flies.forEach(f => { f.m.position.set(f.x + Math.sin(t * 0.7 + f.ph) * 0.06, f.y + Math.cos(t * 0.9 + f.ph) * 0.05, 0.3); setOpacity(f.m, (0.5 + 0.5 * Math.sin(t * 4 + f.ph)) * clamp(age - 1)); });
    };
  };
  FX.food = (g) => {
    const plate = sprite('noodles', 0.62); plate.position.set(-0.08, 0.12, 0.22); g.add(plate);
    const rolls = sprite('springrolls', 0.55); rolls.position.set(0.12, -0.35, 0.3); g.add(rolls);
    const steam = []; for (let i = 0; i < 4; i++) { const s = sprite('steam', 0.1); g.add(s); steam.push({ s, x: -0.2 + i * 0.09, per: rnd(2.2, 3.2), off: rnd(0, 1) }); }
    return (t, age) => {
      popScale(plate, easeOutElastic(age / 1.0)); plate.position.y = 0.12 + Math.sin(t * 2) * 0.012;
      popScale(rolls, easeOutElastic((age - 0.5) / 1.0)); rolls.rotation.z = Math.sin(t * 1.6) * 0.04;
      steam.forEach(s => { const u = ((t / s.per) + s.off) % 1; s.s.position.set(s.x + Math.sin(t * 2 + s.off * 6) * 0.03, 0.22 + u * 0.4, 0.26); s.s.scale.setScalar(0.7 + u * 0.8); setOpacity(s.s, Math.sin(u * Math.PI) * 0.85 * clamp(age - 0.8)); });
    };
  };

  // which effects each card uses (frame + banner + burst + fact are added to every card)
  const RECIPES = {
    about: ['lanterns', 'twinkle'],
    flag: ['flag', 'orbitStars'],
    map: ['map', 'twinkle'],
    population: ['population'],
    history: ['drum', 'twinkle'],
    buffalo: ['buffalo'],
    lotus: ['lotus', 'twinkle'],
    dance: ['dance'],
    bridge: ['bridge', 'twinkle'],
    nature: ['nature'],
    food: ['food'],
  };

  AFRAME.registerComponent('vfx', {
    schema: { index: { type: 'int' } },
    init() {
      const card = window.CARDS[this.data.index];
      card.h = card.h || CARD_H;
      this.card = card;
      this.group = new THREE.Group();
      this.el.object3D.add(this.group);
      const list = ['frame', ...(RECIPES[card.key] || ['twinkle']), 'burst', 'banner', 'fact'];
      this.updaters = list.map(name => FX[name](this.group, card));
      this.foundAt = null;
      this.el.addEventListener('targetFound', () => {
        this.foundAt = performance.now() / 1000;
        window.dispatchEvent(new CustomEvent('vn-found', { detail: card }));
      });
      this.el.addEventListener('targetLost', () => window.dispatchEvent(new CustomEvent('vn-lost', { detail: card })));
    },
    tick(time) {
      if (this.foundAt === null || !this.el.object3D.visible) return;
      const t = time / 1000, age = performance.now() / 1000 - this.foundAt;
      for (const u of this.updaters) u(t, age);
    },
  });

  // expose for the test page
  window.__VN = { FX, RECIPES };
})();
