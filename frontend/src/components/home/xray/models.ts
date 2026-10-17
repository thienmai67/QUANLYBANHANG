import * as THREE from 'three';
import { ModelBuildResult, XRayMesh, LabelSpec } from './types';

function createMat(color: number, roughness = 0.5, metalness = 0.1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    transparent: true,
  });
}

function enableShadows(group: THREE.Group) {
  group.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = true;
    }
  });
}

// ─── 1. DÂY CÁP ĐIỆN CADIVI CV 2.5mm² ──────────────────────────────────────────
// 5 lớp, trục dây = trục X. Thứ tự push: 0 vỏ, 1 mực in, 2-7 sáu sợi ngoài, 8 sợi giữa, 9 vòng mặt cắt.
export function buildCable(): ModelBuildResult {
  const group = new THREE.Group();
  const layers: XRayMesh[] = [];

  const sheathU = {
    title: 'Vỏ bọc PVC',
    sub: 'Dày 0,8mm · 450/750V',
    detail: 'Lớp cách điện PVC dày đúng 0,8mm theo catalog Cadivi, điện áp danh định 450/750V chuẩn TCVN 6610-3 (IEC 60227-3). Hàng nhái thường ăn bớt chính lớp này — mỏng hơn, dễ nứt khi luồn ống.',
    fade: 0.65,
  };
  const printU = {
    title: 'Mực in định danh',
    sub: 'In chìm: Cadivi CV-2.5 · 450/750V',
    detail: 'Dây Cadivi chính hãng in chìm rõ thông số trên vỏ: tên hãng, mã CV-2.5, 450/750V. Mua dây cứ nhìn dòng chữ in — mờ, lệch hay thiếu thông số thì nên nghi ngờ.',
    fade: 0.5,
  };
  const strandU = {
    title: '6 sợi đồng xoắn ngoài',
    sub: '6/0,67mm · xoắn quanh sợi giữa',
    detail: '6 sợi đồng quấn xoắn quanh sợi trung tâm tạo kết cấu 7/0,67. Dạng xoắn giúp dây mềm, dễ uốn cong khi luồn ống gen mà không gãy ruột.',
    fade: 0.25,
  };
  const coreU = {
    title: 'Sợi đồng trung tâm',
    sub: '1/0,67mm · đồng ủ mềm',
    detail: 'Sợi đồng trung tâm đường kính 0,67mm, cùng 6 sợi ngoài tạo tiết diện danh định 2,5mm². Ruột 7 sợi — không phải 1 sợi đặc — là dấu hiệu nhận diện dây CV Cadivi.',
    fade: 0,
  };
  const cutU = {
    title: 'Mặt cắt 7/0,67',
    sub: 'Ø ruột 2,01mm · Ø tổng 3,61mm',
    detail: 'Mặt cắt thực tế: ruột đồng xoắn đường kính khoảng 2,01mm, cả dây khoảng 3,61mm. Điện trở DC tối đa chỉ 7,41 Ω/km ở 20°C — dây càng chuẩn, sụt áp càng thấp.',
    fade: 0.5,
  };

  // [0] Vỏ bọc PVC
  const sheath = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 5.6, 56),
    createMat(0x2b2b20, 0.62, 0.05)
  ) as XRayMesh;
  sheath.rotation.z = Math.PI / 2;
  sheath.userData = { ...sheathU };
  group.add(sheath);
  layers.push(sheath);

  // [1] Mực in định danh (band hở 2 đầu, ôm trên vỏ tại x=+1.8)
  const print = new THREE.Mesh(
    new THREE.CylinderGeometry(1.012, 1.012, 0.45, 56, 1, true),
    createMat(0xf5f2e8, 0.6, 0.05)
  ) as XRayMesh;
  print.rotation.z = Math.PI / 2;
  print.position.x = 1.8;
  print.userData = { ...printU };
  group.add(print);
  layers.push(print);

  // [2-7] 6 sợi đồng xoắn ngoài — nghiêng 8° theo hướng tiếp tuyến để gợi xoắn
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const copperOutMat = createMat(0xd99a3b, 0.28, 0.9);
    copperOutMat.emissive = new THREE.Color(0x3a2408);
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.13, 6.7, 24),
      copperOutMat
    ) as XRayMesh;
    m.position.set(0, Math.cos(a) * 0.27, Math.sin(a) * 0.27);
    m.rotation.set(a, (8 * Math.PI) / 180, Math.PI / 2);
    m.userData = { ...strandU };
    group.add(m);
    layers.push(m);
  }

  // [8] Sợi đồng trung tâm (dài nhất, thò ra đầu rõ nhất)
  const copperCoreMat = createMat(0xd99a3b, 0.28, 0.9);
  copperCoreMat.emissive = new THREE.Color(0x3a2408);
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 7.0, 24),
    copperCoreMat
  ) as XRayMesh;
  core.rotation.z = Math.PI / 2;
  core.userData = { ...coreU };
  group.add(core);
  layers.push(core);

  // [9] Vòng nhấn mặt cắt 7/0,67 tại đầu dây
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.1, 16, 64),
    createMat(0xe8a33d, 0.4, 0.6)
  ) as XRayMesh;
  ring.rotation.y = Math.PI / 2;
  ring.position.x = 2.82;
  ring.userData = { ...cutU };
  group.add(ring);
  layers.push(ring);

  enableShadows(group);

  return {
    group,
    layers,
    camDist: 9.5,
    setXray(s: number) {
      layers.forEach((m) => {
        const u = m.userData;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.opacity = (u.baseO || 1) * (1 - s * (u.fade ?? 0.5));
      });
    },
  };
}

// ─── 2. APTOMAT SCHNEIDER EASY9 1P 16A (EZ9F34116) ────────────────────────────
// Envelope vỏ 2.3×3.4×1.5. 8 nhóm chi tiết (24 mesh):
// 0 vỏ, 1 cần gạt, 2 cửa sổ, 3-4 terminal trên+ốc, 5-6 terminal dưới+ốc,
// 7-11 buồng dập hồ quang, 12-13 lá lưỡng kim, 14-18 cuộn hút, 19 lõi sắt, 20-23 cặp tiếp điểm.
export function buildCB(): ModelBuildResult {
  const group = new THREE.Group();
  const layers: XRayMesh[] = [];

  const shellU = {
    title: 'Vỏ cách điện',
    sub: 'Nhựa cách điện · chịu nhiệt',
    detail: 'Vỏ nhựa cách điện bảo vệ toàn bộ linh kiện bên trong, an toàn tuyệt đối khi thao tác. Màu trắng đặc trưng dòng Schneider Easy9.',
    fade: 0.65,
  };
  const leverU = {
    title: 'Cần gạt',
    sub: 'Đóng/ngắt mạch bằng tay',
    detail: 'Cần gạt thủ công để đóng/ngắt mạch. Gạt dứt khoát, nảy rõ — cảm giác gạt là cách thợ điện kiểm tra nhanh chất lượng một chiếc aptomat.',
    fade: 0.5,
  };
  const winU = {
    title: 'Cửa sổ chỉ thị ON/OFF',
    sub: 'Báo vị trí tiếp điểm · có sẵn theo datasheet',
    detail: 'Cửa sổ hiển thị vị trí tiếp điểm theo đúng datasheet Schneider — nhìn là biết mạch đang đóng hay ngắt, không cần đo thử.',
    fade: 0.45,
    baseO: 0.5,
  };
  const termU = {
    title: 'Đầu nối trên & dưới',
    sub: 'Kẹp dây vào/ra · siết ốc',
    detail: 'Hai đầu nối kẹp dây dẫn vào và ra, siết ốc chắc chắn. Đầu nối lỏng là nguyên nhân phổ biến gây nóng, cháy đầu dây — siết đúng lực là yêu cầu bắt buộc khi lắp đặt.',
    fade: 0.4,
  };
  const arcU = {
    title: 'Buồng dập hồ quang',
    sub: 'Tấm kim loại xếp lớp · chia nhỏ tia lửa',
    detail: 'Khi tiếp điểm mở dưới tải, hồ quang sinh ra được các tấm kim loại chia nhỏ thành nhiều đoạn ngắn, nguội nhanh rồi tắt — chống cháy nổ lan ra vỏ. Đây là cấu tạo chuẩn của mọi aptomat MCB.',
    fade: 0.35,
  };
  const bimU = {
    title: 'Thanh lưỡng kim',
    sub: 'Bảo vệ quá tải · cơ chế nhiệt',
    detail: 'Hai lá kim loại giãn nở khác nhau ép dính vào nhau — dòng vượt định mức làm thanh nóng lên, uốn cong rồi đẩy cơ cấu nhả cắt mạch. Độ trễ này là có chủ ý: cho phép dòng khởi động động cơ thoáng qua mà không nhảy aptomat oan.',
    fade: 0.25,
  };
  const solU = {
    title: 'Cuộn hút điện từ',
    sub: 'Bảo vệ ngắn mạch · đường cong C (5–10×In)',
    detail: 'Cuộn dây đồng quấn quanh lõi sắt. Dòng ngắn mạch tăng đột biến tạo từ trường cực mạnh, hút lõi đập vào cơ cấu nhả — cắt mạch gần như tức thì. Ngưỡng tác động từ 5 đến 10 lần dòng định mức theo đường cong C.',
    fade: 0.2,
  };
  const contU = {
    title: 'Cặp tiếp điểm đóng–cắt',
    sub: 'Cắt dòng sự cố 4,5 kA · IEC 60898-1',
    detail: 'Cặp tiếp điểm đóng/cắt dòng điện khi có sự cố hoặc thao tác tay. Chịu được dòng ngắn mạch 4,5 kA theo chuẩn IEC 60898-1 — gấp gần 280 lần dòng định mức 16A — mà không dính, không cháy.',
    fade: 0,
  };

  // [0] Vỏ cách điện
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 3.4, 1.5),
    createMat(0xe8e5da, 0.45, 0.02)
  ) as XRayMesh;
  shell.userData = { ...shellU };
  group.add(shell);
  layers.push(shell);

  // [1] Cần gạt
  const lever = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.9, 0.3),
    createMat(0x2b2b10, 0.5, 0.1)
  ) as XRayMesh;
  lever.position.set(0, 0.5, 0.85);
  lever.userData = { ...leverU };
  group.add(lever);
  layers.push(lever);

  // [2] Cửa sổ chỉ thị ON/OFF (kính đỏ trong)
  const win = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.5, 0.06),
    createMat(0xd0342c, 0.5, 0.1)
  ) as XRayMesh;
  win.position.set(0, -1.1, 0.76);
  win.userData = { ...winU };
  group.add(win);
  layers.push(win);

  // [3-6] Đầu nối trên & dưới + ốc siết
  [1.5, -1.5].forEach((yy) => {
    const tm = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.35, 0.8),
      createMat(0xc8a24a, 0.35, 0.7)
    ) as XRayMesh;
    tm.position.set(0, yy, 0);
    tm.userData = { ...termU };
    group.add(tm);
    layers.push(tm);

    const sc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.25, 20),
      createMat(0x8a8f94, 0.4, 0.8)
    ) as XRayMesh;
    sc.rotation.x = Math.PI / 2;
    sc.position.set(0, yy, 0.45);
    sc.userData = { ...termU };
    group.add(sc);
    layers.push(sc);
  });

  // [7-11] Buồng dập hồ quang: 5 tấm thép xếp chồng
  for (let k = 0; k < 5; k++) {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.06, 0.9),
      createMat(0x9aa0a6, 0.5, 0.8)
    ) as XRayMesh;
    p.position.set(0.45, 0.75 + k * 0.14, 0);
    p.userData = { ...arcU };
    group.add(p);
    layers.push(p);
  }

  // [12-13] Thanh lưỡng kim: 2 lá ép sát (đồng + thép)
  const b1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 2.2, 0.08),
    createMat(0xc87f3f, 0.4, 0.7)
  ) as XRayMesh;
  b1.position.set(-0.6, 0, 0);
  b1.userData = { ...bimU };
  group.add(b1);
  layers.push(b1);

  const b2 = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 2.2, 0.08),
    createMat(0x9aa0a6, 0.4, 0.7)
  ) as XRayMesh;
  b2.position.set(-0.51, 0, 0);
  b2.userData = { ...bimU };
  group.add(b2);
  layers.push(b2);

  // [14-18] Cuộn hút điện từ: 5 vòng torus nằm ngang + [19] lõi sắt
  for (let k = 0; k < 5; k++) {
    const w = new THREE.Mesh(
      new THREE.TorusGeometry(0.22, 0.06, 12, 32),
      createMat(0xd99a3b, 0.35, 0.9)
    ) as XRayMesh;
    w.rotation.x = Math.PI / 2;
    w.position.set(0.55, -0.55 + k * 0.22, 0);
    w.userData = { ...solU };
    group.add(w);
    layers.push(w);
  }

  const icore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 1.0, 20),
    createMat(0x555a60, 0.5, 0.6)
  ) as XRayMesh;
  icore.position.set(0.55, -0.11, 0);
  icore.userData = { ...solU };
  group.add(icore);
  layers.push(icore);

  // [20-23] Cặp tiếp điểm đóng–cắt
  const cg = new THREE.BoxGeometry(0.5, 0.34, 0.5);
  [
    [-0.45, 0.9],
    [0.45, 0.9],
    [-0.45, -0.9],
    [0.45, -0.9],
  ].forEach(([hx, hy]) => {
    const f = new THREE.Mesh(cg, createMat(0xc9d1d9, 0.25, 0.95)) as XRayMesh;
    f.position.set(hx, hy, 0);
    f.userData = { ...contU };
    group.add(f);
    layers.push(f);
  });

  enableShadows(group);

  return {
    group,
    layers,
    camDist: 7.5,
    setXray(s: number) {
      layers.forEach((m) => {
        const u = m.userData;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.opacity = (u.baseO || 1) * (1 - s * (u.fade ?? 0.5));
      });
    },
  };
}

// ─── 3. ĐỒNG HỒ NƯỚC ZENNER DN20 ───────────────────────────────────────────────
// Thân cylinder r=1 len 3.6 theo trục X; cụm mặt số trên đỉnh (y 0.75–1.78).
// 8 nhóm chi tiết (41 mesh):
// 0 kính, 1 viền, 2-3 rắc-co, 4 thân, 5 buồng mặt số, 6-8 gioăng,
// 9 mặt số, 10-21 vạch, 22 kim, 23 trục, 24-25 bánh răng, 26 NC trên, 27 NC dưới,
// 28 vòng lưới, 29-31 thanh lưới, 32 cối tuabin, 33-40 cánh.
export function buildMeter(): ModelBuildResult {
  const group = new THREE.Group();
  const layers: XRayMesh[] = [];

  const glassU = {
    title: 'Mặt kính',
    sub: 'Kính trong · đọc số trực tiếp',
    detail: 'Mặt kính trong bảo vệ mặt số, đọc chỉ số trực tiếp không cần mở nắp. Mặt số khô nằm cách ly hoàn toàn với nước nên kính không bao giờ bị mờ hơi nước từ bên trong.',
    fade: 0.55,
    baseO: 0.35,
  };
  const raccoU = {
    title: 'Rắc-co nối ren 3/4 inch',
    sub: 'Ren 3/4 inch · nối ống DN20',
    detail: 'Hai đầu rắc-co ren 3/4 inch để nối đồng hồ vào đường ống DN20. Vặn vừa khít, quấn băng tan đúng cách là kín nước.',
    fade: 0.45,
  };
  const bodyU = {
    title: 'Thân đồng thau',
    sub: 'Đúc đồng thau · DN20',
    detail: 'Thân đúc đồng thau nguyên khối, hai đầu ren 3/4 inch nối ống DN20. Theo nhà phân phối, thân đồng là lợi thế lớn ở vùng nước nhiễm phèn — không rỉ sét, vón cục như thân gang.',
    fade: 0.4,
  };
  const gasketU = {
    title: 'Gioăng làm kín',
    sub: 'Cao su · chống rò rỉ',
    detail: 'Gioăng cao su tại các mối nối ren và dưới mặt kính — chi tiết nhỏ nhưng quyết định đồng hồ có bị rò rỉ sau vài năm hay không. Thay gioăng mới mỗi lần tháo đồng hồ là thói quen tốt.',
    fade: 0.5,
  };
  const dialU = {
    title: 'Mặt số hiển thị',
    sub: 'Mặt số khô · đọc trực tiếp, không cần pin',
    detail: 'Bộ đếm cơ hiển thị tổng lưu lượng theo đơn vị m³, đọc trực tiếp không cần pin, không sợ hết điện. Mặt số nằm trong khoang khô cách ly với nước nên không mờ, không đổi màu số.',
    fade: 0.15,
  };
  const gearU = {
    title: 'Bánh răng & khớp từ',
    sub: 'Truyền động xuyên vách kín',
    detail: 'Hệ bánh răng biến số vòng quay của tuabin thành chỉ số lưu lượng. Khớp từ truyền chuyển động từ buồng ướt lên khoang khô xuyên qua vách ngăn kín bằng từ trường — không trục xuyên, không đường rò rỉ.',
    fade: 0.1,
  };
  const filterU = {
    title: 'Lưới lọc đầu vào',
    sub: 'Chặn cặn bẩn trước buồng đo',
    detail: 'Lưới lọc đặt ở đầu vào, chặn cặn bẩn và rác trước khi nước vào buồng đo — bảo vệ cánh quạt khỏi kẹt, gãy. Lưu ý: catalog hãng liệt kê lưới lọc ở mục phụ kiện, khi mua nên hỏi rõ có đi kèm trong hộp hay không.',
    fade: 0.3,
  };
  const turbU = {
    title: 'Tuabin đo lưu lượng',
    sub: 'Quay theo dòng nước · tỉ lệ với lưu lượng',
    detail: 'Cánh quạt bằng nhựa kỹ thuật quay theo dòng nước chảy qua, tốc độ quay tỉ lệ với lưu lượng — đây là trái tim đo đếm của đồng hồ. Nước chảy càng mạnh, số nhảy càng nhanh.',
    fade: 0,
  };

  // [0] Mặt kính + [1] viền
  const g = new THREE.Mesh(
    new THREE.CylinderGeometry(0.95, 0.95, 0.08, 48),
    createMat(0xdce9f5, 0.08, 0)
  ) as XRayMesh;
  g.position.y = 1.78;
  g.userData = { ...glassU };
  group.add(g);
  layers.push(g);

  const rg = new THREE.Mesh(
    new THREE.TorusGeometry(0.95, 0.09, 14, 48),
    createMat(0x8a6d2f, 0.4, 0.8)
  ) as XRayMesh;
  rg.rotation.x = Math.PI / 2;
  rg.position.y = 1.72;
  rg.userData = { ...glassU };
  group.add(rg);
  layers.push(rg);

  // [2-3] Rắc-co nối ren
  [-2, 2].forEach((x) => {
    const n = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.15, 0.7, 6),
      createMat(0xc08f32, 0.35, 0.7)
    ) as XRayMesh;
    n.rotation.z = Math.PI / 2;
    n.position.x = x;
    n.userData = { ...raccoU };
    group.add(n);
    layers.push(n);
  });

  // [4] Thân đồng thau + [5] buồng mặt số
  const b = new THREE.Mesh(
    new THREE.CylinderGeometry(1, 1, 3.6, 48),
    createMat(0xd9a832, 0.32, 0.7)
  ) as XRayMesh;
  b.rotation.z = Math.PI / 2;
  b.userData = { ...bodyU };
  group.add(b);
  layers.push(b);

  const h = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.15, 0.9, 48),
    createMat(0xc79a3a, 0.35, 0.7)
  ) as XRayMesh;
  h.position.y = 1.2;
  h.userData = { ...bodyU };
  group.add(h);
  layers.push(h);

  // [6-8] Gioăng làm kín: 2 tại mối nối ren + 1 dưới mặt kính
  [-1.8, 1.8].forEach((gx) => {
    const gs = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.08, 12, 48),
      createMat(0x1f1f1f, 0.8, 0.1)
    ) as XRayMesh;
    gs.rotation.y = Math.PI / 2;
    gs.position.x = gx;
    gs.userData = { ...gasketU };
    group.add(gs);
    layers.push(gs);
  });

  const gd = new THREE.Mesh(
    new THREE.TorusGeometry(0.88, 0.05, 12, 48),
    createMat(0x1f1f1f, 0.8, 0.1)
  ) as XRayMesh;
  gd.rotation.x = Math.PI / 2;
  gd.position.y = 1.7;
  gd.userData = { ...gasketU };
  group.add(gd);
  layers.push(gd);

  // [9] Mặt số + [10-21] 12 vạch + [22] kim đỏ + [23] trục
  const d = new THREE.Mesh(
    new THREE.CylinderGeometry(0.85, 0.85, 0.06, 48),
    createMat(0xf5f2e8, 0.6, 0.05)
  ) as XRayMesh;
  d.position.y = 1.66;
  d.userData = { ...dialU };
  group.add(d);
  layers.push(d);

  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    const q = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.02, 0.16),
      createMat(0x333333, 0.6, 0.1)
    ) as XRayMesh;
    q.position.set(Math.sin(a) * 0.68, 1.7, Math.cos(a) * 0.68);
    q.rotation.y = a;
    q.userData = { ...dialU };
    group.add(q);
    layers.push(q);
  }

  const nd = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.02, 0.6),
    createMat(0xd0342c, 0.5, 0.2)
  ) as XRayMesh;
  nd.position.set(0, 1.7, 0.12);
  nd.rotation.y = 0.6;
  nd.userData = { ...dialU };
  group.add(nd);
  layers.push(nd);

  const hb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.05, 24),
    createMat(0x333333, 0.6, 0.1)
  ) as XRayMesh;
  hb.position.y = 1.7;
  hb.userData = { ...dialU };
  group.add(hb);
  layers.push(hb);

  // [24-25] Bánh răng + [26] nam châm trên + [27] nam châm dưới (khớp từ xuyên vách)
  [
    [-0.25, 0.16],
    [0.25, 0.12],
  ].forEach(([gx, gr]) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(gr, gr, 0.06, 20),
      createMat(0xc8a24a, 0.4, 0.7)
    ) as XRayMesh;
    m.position.set(gx, 1.45, 0);
    m.userData = { ...gearU };
    group.add(m);
    layers.push(m);
  });

  const mu = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20),
    createMat(0xd0342c, 0.4, 0.3)
  ) as XRayMesh;
  mu.position.set(0, 1.58, 0);
  mu.userData = { ...gearU };
  group.add(mu);
  layers.push(mu);

  const md = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.05, 20),
    createMat(0x2c5fd0, 0.4, 0.3)
  ) as XRayMesh;
  md.position.set(0, 0.5, 0);
  md.userData = { ...gearU };
  group.add(md);
  layers.push(md);

  // [28] Vòng lưới lọc + [29-31] 3 thanh chắn
  const fr = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.07, 12, 48),
    createMat(0x9aa0a6, 0.5, 0.8)
  ) as XRayMesh;
  fr.rotation.y = Math.PI / 2;
  fr.position.x = 1.5;
  fr.userData = { ...filterU };
  group.add(fr);
  layers.push(fr);

  for (let k = 0; k < 3; k++) {
    const br = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 1.3, 0.08),
      createMat(0x9aa0a6, 0.5, 0.8)
    ) as XRayMesh;
    br.position.x = 1.5;
    br.rotation.x = (k * Math.PI) / 3;
    br.userData = { ...filterU };
    group.add(br);
    layers.push(br);
  }

  // [32] Cối tuabin + [33-40] 8 cánh quạt
  const tc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.16, 24),
    createMat(0xbf2c23, 0.5, 0.2)
  ) as XRayMesh;
  tc.position.y = 0.5;
  tc.userData = { ...turbU };
  group.add(tc);
  layers.push(tc);

  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const bl = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.24, 0.42),
      createMat(0xd83b32, 0.45, 0.2)
    ) as XRayMesh;
    bl.position.set(Math.sin(a) * 0.45, 0.5, Math.cos(a) * 0.45);
    bl.rotation.y = a + 0.35;
    bl.userData = { ...turbU };
    group.add(bl);
    layers.push(bl);
  }

  enableShadows(group);

  return {
    group,
    layers,
    camDist: 9.5,
    setXray(s: number) {
      layers.forEach((m) => {
        const u = m.userData;
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.opacity = (u.baseO || 1) * (1 - s * (u.fade ?? 0.5));
      });
    },
  };
}

// ─── MA TRẬN TÁCH TẦNG (EXPLODED VIEW) ─────────────────────────────────────────
export const EXPLODE: Record<string, [number, number, number][]> = {
  cable: [
    [-2.2, 0, 0],
    [-2.7, 0, 0],
    [0.9, 0, 0],
    [0.9, 0, 0],
    [0.9, 0, 0],
    [0.9, 0, 0],
    [0.9, 0, 0],
    [0.9, 0, 0],
    [2.3, 0, 0],
    [-2.2, 0, 0],
  ],
  cb: [
    [0, 2.2, 0],
    [0, 1.0, 1.6],
    [0, -1.2, 1.6],
    [0, 1.8, 1.2],
    [0, 1.8, 1.2],
    [0, -2.4, 0],
    [0, -2.4, 0.6],
    [1.8, 0.6, 0],
    [1.8, 0.6, 0],
    [1.8, 0.6, 0],
    [1.8, 0.6, 0],
    [1.8, 0.6, 0],
    [-1.8, 0, 0],
    [-1.8, 0, 0],
    [1.8, -0.4, 0],
    [1.8, -0.4, 0],
    [1.8, -0.4, 0],
    [1.8, -0.4, 0],
    [1.8, -0.4, 0],
    [1.8, -0.4, 0],
    [-1.4, 0.8, 0],
    [1.4, 0.8, 0],
    [-1.4, -0.8, 0],
    [1.4, -0.8, 0],
  ],
  meter: [
    [0, 1.6, 0],
    [0, 1.6, 0],
    [-2.4, 0, 0],
    [2.4, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [-2.8, 0, 0],
    [2.8, 0, 0],
    [0, 2.0, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.2, 0],
    [0, 1.0, 0],
    [0, 1.0, 0],
    [0, 1.0, 0],
    [0, -1.0, 0],
    [3.0, 0, 0],
    [3.0, 0, 0],
    [3.0, 0, 0],
    [3.0, 0, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
    [0, -1.7, 0],
  ],
};

// ─── NHÃN CHI TIẾT THEO NGƯỠNG SLIDER (LABELS) ────────────────────────────────
export const LABELS: Record<string, LabelSpec[]> = {
  cable: [
    { t: 'Vỏ bọc PVC', s: 'Dày 0,8mm · 450/750V', at: 0.05, mesh: 0, p: [0, 0, 1.02] },
    { t: 'Mực in định danh', s: 'In chìm: Cadivi CV-2.5 · 450/750V', at: 0.18, mesh: 1, p: [1.8, 0, 1.04] },
    { t: '6 sợi đồng xoắn ngoài', s: '6/0,67mm · xoắn quanh sợi giữa', at: 0.38, mesh: 2, p: [0.6, 0.48, 0] },
    { t: 'Sợi đồng trung tâm', s: '1/0,67mm · đồng ủ mềm', at: 0.58, mesh: 8, p: [1.6, 0.22, 0] },
    { t: 'Mặt cắt 7/0,67', s: 'Ø ruột 2,01mm · Ø tổng 3,61mm', at: 0.76, mesh: 9, p: [2.82, 0.95, 0] },
  ],
  cb: [
    { t: 'Vỏ cách điện', s: 'Nhựa cách điện · chịu nhiệt', at: 0.05, mesh: 0, p: [0, 1.2, 0.78] },
    { t: 'Cần gạt', s: 'Đóng/ngắt mạch bằng tay', at: 0.15, mesh: 1, p: [0, 0.5, 1.0] },
    { t: 'Cửa sổ chỉ thị ON/OFF', s: 'Báo vị trí tiếp điểm', at: 0.28, mesh: 2, p: [0, -1.1, 0.82] },
    { t: 'Đầu nối trên & dưới', s: 'Kẹp dây vào/ra · siết ốc', at: 0.4, mesh: 3, p: [0, 1.5, 0.5] },
    { t: 'Buồng dập hồ quang', s: 'Tấm kim loại xếp lớp', at: 0.52, mesh: 7, p: [0.45, 1.0, 0.48] },
    { t: 'Thanh lưỡng kim', s: 'Bảo vệ quá tải · cơ chế nhiệt', at: 0.65, mesh: 12, p: [-0.6, 0.3, 0] },
    { t: 'Cuộn hút điện từ', s: 'Bảo vệ ngắn mạch · đường cong C', at: 0.76, mesh: 14, p: [0.55, -0.4, 0.3] },
    { t: 'Cặp tiếp điểm đóng–cắt', s: 'Cắt dòng sự cố 4,5 kA', at: 0.86, mesh: 20, p: [-0.45, 0.9, 0.3] },
  ],
  meter: [
    { t: 'Mặt kính', s: 'Kính trong · đọc số trực tiếp', at: 0.05, mesh: 0, p: [0, 1.82, 0] },
    { t: 'Rắc-co nối ren 3/4 inch', s: 'Ren 3/4 inch · nối ống DN20', at: 0.14, mesh: 2, p: [0, 0, 1.16] },
    { t: 'Thân đồng thau', s: 'Đúc đồng thau · DN20', at: 0.28, mesh: 4, p: [0, 1.2, 1.0] },
    { t: 'Gioăng làm kín', s: 'Cao su · chống rò rỉ', at: 0.4, mesh: 6, p: [0, 0.98, 0] },
    { t: 'Mặt số hiển thị', s: 'Mặt số khô · không cần pin', at: 0.52, mesh: 9, p: [0, 0.05, 0.85] },
    { t: 'Bánh răng & khớp từ', s: 'Truyền động xuyên vách kín', at: 0.64, mesh: 24, p: [0, 0.05, 0.17] },
    { t: 'Lưới lọc đầu vào', s: 'Chặn cặn bẩn trước buồng đo', at: 0.74, mesh: 28, p: [0, 0.73, 0] },
    { t: 'Tuabin đo lưu lượng', s: 'Quay theo dòng nước', at: 0.84, mesh: 32, p: [0, 0.28, 0.18] },
  ],
};
